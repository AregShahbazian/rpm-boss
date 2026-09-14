/**
 * A microphone that is not one: ten seconds of a real engine, looped.
 *
 * Live mode can only be tested next to a running motorcycle, which is a poor
 * place to hold a laptop. This wears exactly the interface the real capture
 * wears — same options, same `LiveCapture` back — so the ring, the worker, the
 * smoothing, the needle and the scope are handed the same shape of data at the
 * same rate and cannot tell which one they got.
 *
 * It is a developer's tool, gated by `FEATURES.mockLive` and by the samples
 * being in the build at all. Nothing about it ships switched on.
 */
import {decodeBuffer} from '../audio/load'
import {InputError, SAMPLE_RATE} from '../audio/types'
import {sampleUrl} from '../samples'
import type {LiveCapture, LiveOptions} from './stream'

/** Sample 6, whose reference count is 1603 rpm — so the dial has a right answer. */
export const MOCK_SAMPLE = 6
/** The steady part of it: the first seconds carry the phone being brought up to the engine. */
export const MOCK_FROM_S = 3
export const MOCK_TO_S = 13

/**
 * Frames per slice, matching what the native recorder delivers, so the
 * downstream batching sees the same rhythm from both sources. At 16 kHz this
 * is 128 ms of audio.
 */
const CHUNK = 2048

/**
 * How many whole chunks are owed at this moment.
 *
 * The timer is not trusted to be a clock. A throttled tab, a slow frame or a
 * long analysis would each leave the interval behind, and a mock that quietly
 * runs at nine tenths of real time would make every measurement taken against
 * it wrong in the same invisible direction. The wall clock decides, and the
 * tick delivers however many chunks that implies.
 */
export function chunksOwed(elapsedMs: number, sent: number, sampleRate = SAMPLE_RATE): number {
  const due = Math.floor((elapsedMs / 1000) * sampleRate / CHUNK)
  return Math.max(0, due - sent)
}

/**
 * The loop, as an index map.
 *
 * Reading `CHUNK` samples from `at` wraps around the end of the slice rather
 * than stopping at it, so the join is a join and not a gap — the engine note
 * carries across it.
 */
export function readLooped(slice: Float32Array, at: number, out: Float32Array): number {
  for (let i = 0; i < out.length; i++) out[i] = slice[(at + i) % slice.length]
  return (at + out.length) % slice.length
}

export function startMockCapture({onChunk, onOpen, onError}: LiveOptions): LiveCapture {
  let stopped = false
  let timer: ReturnType<typeof setInterval> | undefined

  const stop = () => {
    if (stopped) return
    stopped = true
    if (timer) clearInterval(timer)
    timer = undefined
  }

  void (async () => {
    let slice: Float32Array
    try {
      const response = await fetch(sampleUrl(MOCK_SAMPLE))
      if (!response.ok) throw new Error(`sample ${MOCK_SAMPLE}: ${response.status}`)
      const clip = await decodeBuffer(await response.arrayBuffer(), {kind: 'file', name: 'mock'})
      slice = clip.samples.subarray(
        Math.round(MOCK_FROM_S * clip.sampleRate),
        Math.round(MOCK_TO_S * clip.sampleRate),
      )
    } catch (e) {
      // A broken mock should look like a broken microphone rather than a
      // crash: it goes down the same path, and the screen says one sentence.
      onError(e instanceof InputError ? e : new InputError('listen-failed', e))
      return
    }
    if (stopped) return

    const startedAt = performance.now()
    let at = 0
    let sent = 0
    const out = new Float32Array(CHUNK)

    timer = setInterval(() => {
      const owed = chunksOwed(performance.now() - startedAt, sent)
      for (let i = 0; i < owed; i++) {
        at = readLooped(slice, at, out)
        sent++
        // A copy per chunk: the caller keeps what it is given until the next
        // analysis, and `out` is about to be overwritten.
        onChunk(out.slice())
      }
    }, 50)

    onOpen?.({source: 'mock', sampleRate: SAMPLE_RATE})
  })()

  return {stop}
}
