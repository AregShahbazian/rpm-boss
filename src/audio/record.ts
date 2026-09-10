import { assertMinLength, decodeToClip, trimClip } from './decode'
import { InputError, MAX_RECORD_S, SAMPLE_RATE, type AudioClip } from './types'

export interface RecordOptions {
  maxS?: number
  onTick?: (elapsedS: number) => void
  onDone: (clip: AudioClip) => void
  onError: (err: InputError) => void
}

export interface Recording {
  /** Idempotent. Ends the recording early; `onDone` still fires. */
  stop: () => void
}

/**
 * All three processors off, which for this app is not optional: with echo
 * cancellation on, Android hands back a voice-processed stream that gates a
 * steady engine note about a second in, and a steady engine note is the only
 * thing the app is listening for. Measured on an ASUS AI2302: full level for
 * one second, then forty times quieter for two.
 *
 * `channelCount: 1` is a request, not a promise; the capture below mixes down
 * whatever arrives.
 */
const MIC_CONSTRAINTS: MediaStreamConstraints = {
  audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 },
}

/** Under this the microphone delivered nothing worth decoding. */
const MIN_FRAMES = 2048

function micError(e: unknown): InputError {
  const name = (e as { name?: string })?.name
  if (name === 'NotAllowedError' || name === 'SecurityError') return new InputError('mic-denied', e)
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return new InputError('no-mic', e)
  return new InputError('record-failed', e)
}

function timeLabel(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `Recording ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function join(chunks: Float32Array[]): Float32Array {
  let total = 0
  for (const c of chunks) total += c.length
  const out = new Float32Array(total)
  let at = 0
  for (const c of chunks) {
    out.set(c, at)
    at += c.length
  }
  return out
}

/**
 * Record from the microphone with a wall-clock hard stop at `maxS` seconds.
 *
 * Capture goes through an audio worklet rather than `MediaRecorder`. Two
 * reasons, both learned the hard way: with the voice processors switched off
 * this device's MediaRecorder delivers container headers and no audio at all,
 * and a worklet hands over raw samples, so there is no encode, no container
 * and no decode round trip between the microphone and the analysis.
 */
export function record({ maxS = MAX_RECORD_S, onTick, onDone, onError }: RecordOptions): Recording {
  let stream: MediaStream | undefined
  let context: AudioContext | undefined
  let stopped = false
  let finished = false
  let ticker: ReturnType<typeof setInterval> | undefined
  let hardStop: ReturnType<typeof setTimeout> | undefined
  const chunks: Float32Array[] = []

  const release = () => {
    if (ticker) clearInterval(ticker)
    if (hardStop) clearTimeout(hardStop)
    stream?.getTracks().forEach((t) => t.stop())
    void context?.close()
  }

  const finish = () => {
    if (finished) return
    finished = true
    const rate = context?.sampleRate ?? SAMPLE_RATE
    release()

    try {
      const samples = join(chunks)
      if (samples.length < MIN_FRAMES) throw new InputError('no-audio')
      const clip = decodeToClip([samples], rate, { kind: 'mic', name: timeLabel() })
      onDone(assertMinLength(trimClip(clip, maxS)))
    } catch (e) {
      onError(e instanceof InputError ? e : new InputError('record-failed', e))
    }
  }

  const stop = () => {
    if (stopped) return
    stopped = true
    if (context) finish()
    else release()
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
    if (stopped) {
      release()
      return
    }
    if (import.meta.env.DEV) {
      // What the platform actually applied, which on Android often differs
      // from what was asked for. The first thing to read if capture misbehaves.
      console.info('mic settings', stream.getAudioTracks()[0]?.getSettings())
    }

    try {
      // The microphone's own rate, not the app rate: asking an input context
      // to resample is where devices tend to disagree. `decodeToClip` brings
      // it to 16 kHz afterwards with code that is under test.
      context = new AudioContext()
      await context.audioWorklet.addModule(new URL('./capture-worklet.js', import.meta.url))
      if (stopped) {
        release()
        return
      }
      const source = context.createMediaStreamSource(stream)
      const capture = new AudioWorkletNode(context, 'capture', { numberOfOutputs: 0 })
      capture.port.onmessage = (event: MessageEvent<Float32Array>) => chunks.push(event.data)
      source.connect(capture)
      await context.resume()
    } catch (e) {
      release()
      onError(new InputError('record-failed', e))
      return
    }

    const startedAt = performance.now()
    onTick?.(0)
    ticker = setInterval(() => onTick?.((performance.now() - startedAt) / 1000), 100)
    hardStop = setTimeout(stop, maxS * 1000)
  })()

  return { stop }
}
