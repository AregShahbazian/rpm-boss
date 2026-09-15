/**
 * A microphone that never stops: slices of 16 kHz mono audio, handed over as
 * they arrive.
 *
 * The same two implementations as `record()`, and for the same reason — the
 * native plugin is the only way to get unprocessed audio on Android, and the
 * browser is the development loop. Neither one keeps the audio; what to do
 * with a slice is the caller's business (`Ring`).
 */
import {Capacitor} from '@capacitor/core'
import type {PluginListenerHandle} from '@capacitor/core'
import {decodeBase64, pcm16ToFloat, RawAudio} from '../audio/native'
import {resampleTo16k} from '../audio/resample'
import {InputError, SAMPLE_RATE} from '../audio/types'
import type {MockEngine} from './mock'

export interface LiveCapture {
  /** Idempotent. */
  stop: () => void
  /**
   * The simulated engine only: what about it should change, from now on.
   *
   * Partial, because the two callers each know one half — the slider sets a
   * speed, the settings set a stroke — and neither should have to carry the
   * other's value around to say its own. What the engine is currently doing is
   * remembered by the thing running it.
   *
   * Optional because a microphone cannot be tuned, and should not have to carry
   * a no-op saying so. See `mock.ts`.
   */
  tune?: (engine: Partial<MockEngine>) => void
}

export interface LiveOptions {
  /** Mono, 16 kHz, chronological. Called several times a second. */
  onChunk: (samples: Float32Array) => void
  /** Once, when the microphone is open. */
  onOpen?: (info: { source: string; sampleRate: number }) => void
  onError: (err: InputError) => void
}

/**
 * A native cap, in seconds, so a live capture that is never stopped — the
 * activity dies, a JS error eats the stop — cannot hold the microphone
 * forever. Ten minutes is far longer than anyone points a phone at an engine.
 */
const LIVE_MAX_S = 600

/**
 * Frames are batched to about this many before being resampled and handed on.
 * The resampler zero-pads its edges, so converting a 128-frame render quantum
 * on its own would make the edge artefact most of the chunk. The native side
 * already delivers 2048 at a time; this is what makes the browser path match.
 */
const BATCH_FRAMES = 2048

/** Same three off as when recording: voice processing gates a steady engine note. */
const MIC_CONSTRAINTS: MediaStreamConstraints = {
  audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 },
}

function micError(e: unknown): InputError {
  const name = (e as { name?: string })?.name
  if (name === 'NotAllowedError' || name === 'SecurityError') return new InputError('mic-denied', e)
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return new InputError('no-mic', e)
  return new InputError('record-failed', e)
}

/**
 * Collects render quanta until there are enough to resample, then emits one
 * chunk at 16 kHz. A rate already at 16 kHz — which is what the native
 * recorder asks for first — passes straight through.
 */
export function batcher(sampleRate: number, onChunk: (samples: Float32Array) => void) {
  const held: Float32Array[] = []
  let heldFrames = 0

  return (frames: Float32Array) => {
    held.push(frames)
    heldFrames += frames.length
    if (heldFrames < BATCH_FRAMES) return

    const joined = new Float32Array(heldFrames)
    let at = 0
    for (const part of held) {
      joined.set(part, at)
      at += part.length
    }
    held.length = 0
    heldFrames = 0
    onChunk(sampleRate === SAMPLE_RATE ? joined : resampleTo16k(joined, sampleRate))
  }
}

export function startLiveCapture(options: LiveOptions): LiveCapture {
  return Capacitor.isNativePlatform() ? liveNative(options) : liveWorklet(options)
}

function liveNative({ onChunk, onOpen, onError }: LiveOptions): LiveCapture {
  let stopped = false
  let listener: PluginListenerHandle | undefined
  let feed: ((frames: Float32Array) => void) | undefined

  /*
   * Giving back the microphone, separately from deciding to.
   *
   * These were one function, guarded by `stopped`, and the guard was the bug: a
   * stop that arrives while `RawAudio.start` is still in flight sets the flag
   * and asks a recorder that does not exist yet to stop. The recorder then
   * opens, into a run nobody is waiting for, and the second call — the one
   * below, after `start` resolves — did nothing, because the flag was already
   * set. The microphone stayed open until the native cap ran out, ten minutes
   * later, with the app showing no sign of it.
   *
   * Idempotent rather than guarded: removing a removed listener and stopping a
   * stopped recorder are both fine, and one of them has to be allowed to
   * happen twice.
   */
  const release = () => {
    void listener?.remove()
    void RawAudio.stop().catch(() => undefined)
  }

  const stop = () => {
    stopped = true
    release()
  }

  void (async () => {
    try {
      // Attached before start: the reader thread begins emitting the moment
      // the recorder opens, and a slice with nobody listening is just gone.
      listener = await RawAudio.addListener('frames', (event) => {
        if (stopped) return
        feed ??= batcher(event.sampleRate, onChunk)
        feed(pcm16ToFloat(decodeBase64(event.pcm16)))
      })
      const started = await RawAudio.start({ maxS: LIVE_MAX_S, stream: true })
      // Stopped while it was opening. Now there is something to stop.
      if (stopped) {
        release()
        return
      }
      onOpen?.({ source: started.source, sampleRate: started.sampleRate })
    } catch (e) {
      const code = (e as { code?: string })?.code
      void listener?.remove()
      onError(code === 'mic-denied' || code === 'no-mic' ? new InputError(code) : new InputError('record-failed', e))
    }
  })()

  return { stop }
}

/**
 * Everything after the audio exists: the capture worklet, the batching, the
 * muted sink, and the promise that the context is running.
 *
 * Shared, because the simulated engine needs exactly this and none of what
 * surrounds it below — no permission to ask for, no device to release. The
 * caller owns the context and the node; this owns what happens between them
 * and `onChunk`.
 */
export async function captureFrom(
  context: AudioContext,
  source: AudioNode,
  {onChunk, onOpen}: LiveOptions,
  label: string,
  alive: () => boolean,
): Promise<void> {
  await context.audioWorklet.addModule(new URL('../audio/capture-worklet.js', import.meta.url))
  if (!alive()) return

  const feed = batcher(context.sampleRate, onChunk)
  const capture = new AudioWorkletNode(context, 'capture')
  capture.port.onmessage = (event: MessageEvent<Float32Array>) => {
    if (alive()) feed(event.data)
  }
  // The same muted path to the destination as the recorder uses: a capture
  // node that reaches nothing is rendered with silence in its input.
  const muted = context.createGain()
  muted.gain.value = 0
  source.connect(capture)
  capture.connect(muted).connect(context.destination)
  await context.resume()
  /*
   * Checked again, because resuming a context is not instant — a suspended one
   * in an Android WebView can take a hundred milliseconds and more, and a Stop
   * pressed inside that window has already put the hook back to `off`. Calling
   * `onOpen` after it sets `listening` on top of a torn-down run: the stop
   * button and the scope on screen, the ring, the timer and the worker all
   * gone, and nothing to do about it but press stop a second time. This is the
   * same zombie `generation` guards the analysis against, arriving by the one
   * door that does not go through the analysis.
   */
  if (!alive()) return
  onOpen?.({ source: label, sampleRate: context.sampleRate })
}

function liveWorklet(options: LiveOptions): LiveCapture {
  const { onError } = options
  let stream: MediaStream | undefined
  let context: AudioContext | undefined
  let stopped = false

  /*
   * The same split as `liveNative`, for the same reason. Stop pressed while
   * Chrome's permission prompt is still up sets the flag and releases a stream
   * that does not exist; the user then grants, `getUserMedia` resolves, and the
   * tracks it hands over are never stopped — the browser's recording indicator
   * stays lit on a screen that has gone back to a dial at zero.
   */
  const release = () => {
    stream?.getTracks().forEach((t) => t.stop())
    if (context && context.state !== 'closed') void context.close()
  }

  const stop = () => {
    stopped = true
    release()
  }

  void (async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      onError(new InputError('insecure-origin'))
      return
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS)
    } catch (e) {
      onError(micError(e))
      return
    }
    // Stopped while the prompt was up, or while the device was opening.
    if (stopped) {
      release()
      return
    }

    try {
      context = new AudioContext()
      await captureFrom(context, context.createMediaStreamSource(stream), options, 'web-worklet', () => !stopped)
      // `captureFrom` returns early on a stop, and leaves the context it was
      // handed open. It belongs to this function, so closing it does too.
      if (stopped) release()
    } catch (e) {
      stop()
      onError(new InputError('record-failed', e))
    }
  })()

  return { stop }
}
