/**
 * The native recorder's face on the web side.
 *
 * Android will not give a web page unprocessed microphone audio, and processed
 * audio has the engine note gated out of it about a second in (see the phase 4
 * discussion note). The Kotlin-free Java plugin behind this opens `AudioRecord`
 * on `UNPROCESSED` and hands back raw PCM.
 */
import { registerPlugin } from '@capacitor/core'
import { assertMinLength, decodeToClip, trimClip } from './decode'
import { InputError, MAX_RECORD_S, type AudioClip } from './types'
import type { RecordOptions, Recording } from './record'

export interface StartResult {
  /** Which source actually opened: UNPROCESSED, VOICE_RECOGNITION or MIC. */
  source: string
  sampleRate: number
  /** What the device advertises, which is not always what it gives. */
  claimsUnprocessed: boolean
}

export interface StopResult {
  /** The whole take, 16-bit little-endian PCM, base64. */
  pcm16: string
  sampleRate: number
  source: string
}

interface RawAudioPlugin {
  start(): Promise<StartResult>
  stop(): Promise<StopResult>
}

export const RawAudio = registerPlugin<RawAudioPlugin>('RawAudio')

/** The source the last recording actually used, for the review and for bug reports. */
export let lastSource: string | undefined

function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/** 16-bit little-endian PCM to the -1..1 floats the rest of the app speaks. */
export function pcm16ToFloat(bytes: Uint8Array): Float32Array {
  const count = bytes.length >> 1
  const out = new Float32Array(count)
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  for (let i = 0; i < count; i++) out[i] = view.getInt16(i * 2, true) / 32768
  return out
}

function toError(e: unknown): InputError {
  const message = (e as { message?: string })?.message ?? ''
  if (message === 'mic-denied' || message === 'no-mic') return new InputError(message)
  return new InputError('record-failed', e)
}

function timeLabel(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `Recording ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/**
 * Same contract as the browser recorder: a wall-clock hard stop, ticks for the
 * countdown, and an `AudioClip` through the same `decodeToClip`. Nothing above
 * this ever learns which recorder ran.
 */
export function recordNative({ maxS = MAX_RECORD_S, onTick, onDone, onError }: RecordOptions): Recording {
  let stopped = false
  let finished = false
  let ticker: ReturnType<typeof setInterval> | undefined
  let hardStop: ReturnType<typeof setTimeout> | undefined

  const clearTimers = () => {
    if (ticker) clearInterval(ticker)
    if (hardStop) clearTimeout(hardStop)
  }

  const finish = async () => {
    if (finished) return
    finished = true
    clearTimers()
    try {
      const { pcm16, sampleRate, source } = await RawAudio.stop()
      lastSource = source
      const samples = pcm16ToFloat(decodeBase64(pcm16))
      if (!samples.length || !samples.some((v) => v !== 0)) throw new InputError('no-audio')
      const clip: AudioClip = decodeToClip([samples], sampleRate, { kind: 'mic', name: timeLabel() })
      onDone(assertMinLength(trimClip(clip, maxS)))
    } catch (e) {
      onError(e instanceof InputError ? e : toError(e))
    }
  }

  const stop = () => {
    if (stopped) return
    stopped = true
    void finish()
  }

  void (async () => {
    try {
      const started = await RawAudio.start()
      lastSource = started.source
      if (import.meta.env.DEV) console.info('[rec] native source', started)
    } catch (e) {
      clearTimers()
      onError(toError(e))
      return
    }
    if (stopped) return

    const startedAt = performance.now()
    onTick?.(0)
    ticker = setInterval(() => onTick?.((performance.now() - startedAt) / 1000), 100)
    hardStop = setTimeout(stop, maxS * 1000)
  })()

  return { stop }
}
