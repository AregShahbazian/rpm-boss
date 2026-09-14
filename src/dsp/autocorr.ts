/**
 * Pulse rate from the envelope, by autocorrelation.
 *
 * Mirrors `window_rate()` and `autocorr_rate()` in
 * `scripts/reference/analyse.py`.
 */
import {autocorrelate} from './fft'
import {MAX_RPM, rateScale, REVS_PER_PULSE, type RevsPerPulse} from './types'

/** Each window is estimated on its own and the results are pooled. */
export const WINDOW_S = 1

/**
 * The combustion rates worth searching, in pulses per second.
 *
 * The floor is 600 rpm, not the 960 it was. 960 was the bottom of the seven
 * ground-truth recordings rather than a limit anything measured: a Royal
 * Enfield idles at 800-1,000, a mistuned bike hunting at 600-700 is the case
 * this app exists for, and a generator at half speed sits at 1,500 or 1,800.
 * Five pulses still put five periods inside the one-second window, which is
 * what the autocorrelation needs to find one.
 *
 * The ceiling is not a number here at all. It is `MAX_RPM` converted, so the
 * estimator's range and the tachometer's face cannot drift apart.
 *
 * Both are four-stroke figures. `rateRangeFor` gives the same 600 to `MAX_RPM`
 * for the engine at hand, which on a two-stroke is twice the combustion rate at
 * either end: the dial is the same dial, the sound arrives twice as fast.
 */
export const MIN_RATE = 5
export const MAX_RATE = MAX_RPM / 60 / REVS_PER_PULSE

/**
 * How far past either end of the dial the search reaches. An engine at
 * exactly `MAX_RPM` has cycles a little shorter than that on either side of
 * it, and a cycle shorter than the shortest lag searched cannot be found at
 * all: at 12,000 set, half the windows found the period and half found double
 * it, and the median read three quarters. The same at the floor, where the
 * period runs past the longest lag. Ten percent is more than any jitter; the
 * dial pins at its ends, and the figure beside it says what was measured.
 */
export const SEARCH_HEADROOM = 1.1

export interface RateRange {
  minRate: number
  maxRate: number
}

export const rateRangeFor = (revsPerPulse: RevsPerPulse): RateRange => ({
  minRate: (MIN_RATE / SEARCH_HEADROOM) * rateScale(revsPerPulse),
  maxRate: MAX_RATE * SEARCH_HEADROOM * rateScale(revsPerPulse),
})

const FOUR_STROKE: RateRange = rateRangeFor(REVS_PER_PULSE)

export interface Estimate {
  pulsesPerS: number
  /**
   * How far the winning correlation peak stands above the trough before it.
   * An engine scores above 0.5, noise below 0.35; see the phase 4 design.
   */
  confidence: number
}

export function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = sorted.length >> 1
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * How strong a divisor's own teeth must be, next to the ones it shares with
 * the tallest peak, to be taken for the period rather than for something that
 * happens twice a cycle. Measured: the period scores 0.80 to 1.03 against its
 * tallest multiple on synthetic engines up to 12,000 rpm; the loudest
 * once-a-revolution sound in the seven ground-truth four-strokes scores 0.45.
 */
export const FUNDAMENTAL_MIN = 0.65

/** How far a lag may sit from a whole multiple of another and still count as one. */
const MULTIPLE_SLACK = 0.015

/** The correlation at `at`, or the best within one percent of it: the period is not a whole number of samples. */
function tooth(ac: Float64Array, at: number): number {
  const slack = Math.max(2, Math.round(at * 0.01))
  let best = -Infinity
  for (let j = Math.max(1, at - slack); j <= Math.min(ac.length - 1, at + slack); j++) {
    if (ac[j] > best) best = ac[j]
  }
  return best
}

/**
 * The peaks worth considering: local maxima that are also the highest point
 * within a tenth of their own lag either side. The second condition is what
 * keeps a bump on the shoulder of a real peak from counting as one, and what
 * keeps the correlation's own fall from lag zero — still higher at the
 * shortest lag searched than at the period, when the pulses are wide — from
 * being mistaken for a peak at all.
 */
export function peaks(ac: Float64Array, lagMin: number, lagMax: number): number[] {
  const out: number[] = []
  for (let lag = Math.max(1, lagMin); lag <= lagMax; lag++) {
    if (ac[lag] <= ac[lag - 1] || ac[lag] < ac[lag + 1]) continue
    const from = Math.max(1, Math.floor(lag * 0.9))
    const to = Math.min(ac.length - 1, Math.ceil(lag * 1.1))
    let top = true
    for (let k = from; k <= to && top; k++) if (ac[k] > ac[lag]) top = false
    if (top) out.push(lag)
  }
  return out
}

/**
 * Is `lag` the period, given that the tallest peak sits at `k` times it?
 *
 * Its comb has teeth at every multiple; the tallest peak's comb has every
 * k-th of them. If `lag` is the period, the teeth in between are as strong as
 * the ones they share — one cycle looks like the next. If `lag` is only
 * something that happens k times a cycle, the teeth in between are the weak
 * ones. The ratio says which.
 */
function fundamentalRatio(ac: Float64Array, lag: number, k: number, lagMax: number): number {
  let own = 0
  let ownCount = 0
  let shared = 0
  let sharedCount = 0
  for (let j = 1; j * lag <= lagMax; j++) {
    const v = tooth(ac, j * lag)
    if (j % k === 0) {
      shared += v
      sharedCount++
    } else {
      own += v
      ownCount++
    }
  }
  return own / ownCount / (shared / sharedCount)
}

/**
 * The period, which is not always the tallest peak.
 *
 * A regular engine correlates with itself almost equally at one period, at
 * two and at three, and at the top of the dial the pulses are short enough
 * that noise decides which of P, 2P, 3P stands tallest: a two-stroke at 9,000
 * read 3,000, then 6,000, then 4,500 from one window to the next. So the
 * tallest peak is the starting point, not the answer: any shorter peak it is
 * a whole multiple of is tried, shortest first, and the first whose comb
 * holds up — see `fundamentalRatio` — is the period.
 */
export function fundamental(ac: Float64Array, lagMin: number, lagMax: number): number | undefined {
  const candidates = peaks(ac, lagMin, lagMax)
  if (!candidates.length) return undefined
  let tallest = candidates[0]
  for (const lag of candidates) if (ac[lag] > ac[tallest]) tallest = lag
  for (const lag of candidates) {
    if (lag >= tallest) break
    const k = Math.round(tallest / lag)
    if (k < 2 || Math.abs(tallest - k * lag) > MULTIPLE_SLACK * tallest) continue
    if (fundamentalRatio(ac, lag, k, lagMax) >= FUNDAMENTAL_MIN) return lag
  }
  return tallest
}

/** Estimate for one window, or undefined if it holds nothing to measure. */
export function windowEstimate(
  window: Float64Array,
  sampleRate: number,
  range: RateRange = FOUR_STROKE,
): Estimate | undefined {
  let mean = 0
  for (const v of window) mean += v
  mean /= window.length

  let variance = 0
  const centred = new Float64Array(window.length)
  for (let i = 0; i < window.length; i++) {
    centred[i] = window[i] - mean
    variance += centred[i] * centred[i]
  }
  if (Math.sqrt(variance / window.length) < 1e-9) return undefined

  const lagMin = Math.floor(sampleRate / range.maxRate)
  const lagMax = Math.floor(sampleRate / range.minRate)
  if (lagMax + 1 >= window.length) return undefined

  const ac = autocorrelate(centred, lagMax + 1)
  // Normalise by the exact sum of squares rather than by the transform's own
  // lag-zero value, which carries the FFT's rounding error.
  if (variance <= 0) return undefined
  for (let i = 0; i < ac.length; i++) ac[i] /= variance

  const peak = fundamental(ac, lagMin, lagMax)
  if (peak === undefined) return undefined

  let trough = 0
  if (peak > 1) {
    trough = ac[1]
    for (let lag = 1; lag <= peak; lag++) if (ac[lag] < trough) trough = ac[lag]
  }

  // Parabolic refinement. Without it the lag is a whole number of samples,
  // which at the fast end of the rate range is a step of several per cent.
  let lag = peak
  if (peak > 0 && peak + 1 < ac.length) {
    const curvature = ac[peak - 1] - 2 * ac[peak] + ac[peak + 1]
    if (Math.abs(curvature) > 1e-12) {
      const offset = (0.5 * (ac[peak - 1] - ac[peak + 1])) / curvature
      // A true peak's refinement is within half a sample of it. Anything wider
      // means the three points do not describe a maximum, which happens on
      // degenerate audio and used to produce a negative lag and a negative rpm.
      if (Math.abs(offset) <= 0.5) lag += offset
    }
  }

  return {pulsesPerS: sampleRate / lag, confidence: ac[peak] - trough}
}

/**
 * Median over consecutive one-second windows. Median rather than mean so that
 * one window holding a door slam cannot drag the answer with it. A tail
 * shorter than a full window is dropped.
 */
export function rateFromEnvelope(
  env: Float64Array,
  sampleRate: number,
  range: RateRange = FOUR_STROKE,
): Estimate | undefined {
  const size = Math.round(WINDOW_S * sampleRate)
  const rates: number[] = []
  const confidences: number[] = []

  for (let start = 0; start + size <= env.length; start += size) {
    const got = windowEstimate(env.subarray(start, start + size), sampleRate, range)
    if (!got) continue
    rates.push(got.pulsesPerS)
    confidences.push(got.confidence)
  }

  if (!rates.length) return undefined
  return {pulsesPerS: median(rates), confidence: median(confidences)}
}
