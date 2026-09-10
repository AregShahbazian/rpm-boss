import { trimClip } from './decode'
import { decodeBuffer } from './load'
import { InputError, MAX_RECORD_S, type AudioClip } from './types'

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
 * Echo cancellation is deliberately left at the browser default: on Android
 * Chrome (seen on ASUS AI2302, Chrome 140) `echoCancellation: false` switches
 * capture to a raw path that never delivers frames to MediaRecorder.
 */
const MIC_CONSTRAINTS: MediaStreamConstraints = {
  audio: { noiseSuppression: false, autoGainControl: false, channelCount: 1 },
}

/** Below this the recorder produced only container headers, no audio. */
const MIN_BLOB_BYTES = 1024

function micError(e: unknown): InputError {
  const name = (e as { name?: string })?.name
  if (name === 'NotAllowedError' || name === 'SecurityError') return new InputError('mic-denied', e)
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return new InputError('no-mic', e)
  return new InputError('record-failed', e)
}

function timeLabel(d = new Date()): string {
  return `Recording ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * Record from the microphone with a wall-clock hard stop at `maxS` seconds.
 * The blob goes through the same decode path as an uploaded file, then a
 * safety trim guarantees the duration contract even if the recorder overshoots.
 */
export function record({ maxS = MAX_RECORD_S, onTick, onDone, onError }: RecordOptions): Recording {
  let recorder: MediaRecorder | undefined
  let stream: MediaStream | undefined
  let stopped = false
  let ticker: ReturnType<typeof setInterval> | undefined
  let hardStop: ReturnType<typeof setTimeout> | undefined
  const chunks: BlobPart[] = []

  const cleanup = () => {
    if (ticker) clearInterval(ticker)
    if (hardStop) clearTimeout(hardStop)
    stream?.getTracks().forEach((t) => t.stop())
  }

  const stop = () => {
    if (stopped) return
    stopped = true
    if (recorder && recorder.state !== 'inactive') recorder.stop()
    else cleanup()
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
      cleanup()
      return
    }
    try {
      recorder = new MediaRecorder(stream)
    } catch (e) {
      cleanup()
      onError(new InputError('record-failed', e))
      return
    }
    const startedAt = performance.now()
    const name = timeLabel()

    recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) chunks.push(ev.data)
    }
    recorder.onerror = () => {
      cleanup()
      onError(new InputError('record-failed'))
    }
    recorder.onstop = async () => {
      cleanup()
      try {
        const blob = new Blob(chunks, { type: recorder?.mimeType })
        if (import.meta.env.DEV) console.info('[rec] chunks', chunks.length, 'bytes', blob.size, 'type', blob.type, 'elapsed', ((performance.now() - startedAt) / 1000).toFixed(2))
        if (blob.size < MIN_BLOB_BYTES) throw new InputError('no-audio')
        const buf = await blob.arrayBuffer()
        const clip = await decodeBuffer(buf, { kind: 'mic', name })
        onDone(trimClip(clip, maxS))
      } catch (e) {
        onError(e instanceof InputError && e.code !== 'undecodable' ? e : new InputError('record-failed', e))
      }
    }

    try {
      recorder.start(250)
    } catch (e) {
      cleanup()
      onError(new InputError('record-failed', e))
      return
    }
    onTick?.(0)
    ticker = setInterval(() => onTick?.((performance.now() - startedAt) / 1000), 100)
    hardStop = setTimeout(stop, maxS * 1000)
  })()

  return { stop }
}
