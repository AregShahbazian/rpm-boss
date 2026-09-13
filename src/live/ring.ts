/**
 * The sliding window the live reading is taken from.
 *
 * Nothing is recorded: the microphone overwrites a fixed array oldest-first,
 * and every reading is the last `LIVE_WINDOW_S` seconds of it. Memory is
 * constant however long the engine runs.
 */
import { SAMPLE_RATE } from '../audio/types'

/**
 * How much audio one reading is made from.
 *
 * This is the knob that trades responsiveness for a steady number: shorter
 * reacts to a blip of throttle sooner, longer averages it away. `MIN_ANALYSIS_S`
 * is the floor — below it the analysis refuses the window — and 2 s is that
 * floor, so the live reading is as quick as the DSP allows. Named rather than
 * inlined because the backlog wants it as a user slider.
 */
export const LIVE_WINDOW_S = 2

/**
 * How often the window is re-analysed. Ten times the render quantum the
 * microphone arrives in, and well under the window it reads, so consecutive
 * readings overlap by 90%: the number moves smoothly instead of stepping.
 */
export const LIVE_INTERVAL_MS = 200

/** How many readings the displayed number is the median of. See `useLive`. */
export const LIVE_SMOOTH_N = 5

/** How much of the tail the scope draws. Long enough to show several combustions. */
export const LIVE_SCOPE_S = 0.25

/**
 * A fixed-size circular buffer of mono 16 kHz samples.
 *
 * `snapshot` hands back the window in chronological order, which is what the
 * analysis wants and what the wrap-around makes non-trivial. It writes into a
 * buffer it owns and reuses: at five snapshots a second, allocating 128 kB
 * each time would be the largest thing this feature does.
 */
export class Ring {
  readonly capacity: number
  private readonly buf: Float32Array
  private readonly scratch: Float32Array
  /** Where the next sample goes. */
  private at = 0
  private filled = 0

  constructor(capacity: number = Math.round(LIVE_WINDOW_S * SAMPLE_RATE)) {
    this.capacity = capacity
    this.buf = new Float32Array(capacity)
    this.scratch = new Float32Array(capacity)
  }

  /** True once the window has been filled at least once. */
  get full(): boolean {
    return this.filled >= this.capacity
  }

  push(chunk: Float32Array): void {
    // A chunk longer than the whole window would wrap over itself; only its
    // tail could survive anyway.
    const src = chunk.length > this.capacity ? chunk.subarray(chunk.length - this.capacity) : chunk
    const head = Math.min(src.length, this.capacity - this.at)
    this.buf.set(src.subarray(0, head), this.at)
    if (head < src.length) this.buf.set(src.subarray(head), 0)
    this.at = (this.at + src.length) % this.capacity
    this.filled = Math.min(this.capacity, this.filled + src.length)
  }

  /**
   * The window, oldest sample first. The returned array is reused on the next
   * call, so it must be consumed (or copied) before then. `postMessage`
   * structured-clones it, which counts as consuming it.
   */
  snapshot(): Float32Array {
    const tail = this.capacity - this.at
    this.scratch.set(this.buf.subarray(this.at), 0)
    this.scratch.set(this.buf.subarray(0, this.at), tail)
    return this.scratch
  }

  /**
   * The newest `count` samples, oldest first, written into `out`. Separate
   * from `snapshot` because the scope runs on animation frames and wants a
   * short tail, not the whole window.
   */
  latest(out: Float32Array): void {
    const count = Math.min(out.length, this.capacity)
    const from = (this.at - count + this.capacity) % this.capacity
    const head = Math.min(count, this.capacity - from)
    out.set(this.buf.subarray(from, from + head), 0)
    if (head < count) out.set(this.buf.subarray(0, count - head), head)
  }
}
