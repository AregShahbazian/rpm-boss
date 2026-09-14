/**
 * Pulse rate from the envelope, by autocorrelation.
 *
 * Mirrors `window_rate()` and `autocorr_rate()` in
 * `scripts/reference/analyse.py`.
 */
import {autocorrelate} from './fft'
import {MAX_RPM, REVS_PER_PULSE} from './types'

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
 */
export const MIN_RATE = 5
export const MAX_RATE = MAX_RPM / 60 / REVS_PER_PULSE

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

/** Estimate for one window, or undefined if it holds nothing to measure. */
export function windowEstimate(window: Float64Array, sampleRate: number): Estimate | undefined {
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

  const lagMin = Math.floor(sampleRate / MAX_RATE)
  const lagMax = Math.floor(sampleRate / MIN_RATE)
  if (lagMax + 1 >= window.length) return undefined

  const ac = autocorrelate(centred, lagMax + 1)
  // Normalise by the exact sum of squares rather than by the transform's own
  // lag-zero value, which carries the FFT's rounding error.
  if (variance <= 0) return undefined
  for (let i = 0; i < ac.length; i++) ac[i] /= variance

  let peak = lagMin
  for (let lag = lagMin; lag <= lagMax; lag++) if (ac[lag] > ac[peak]) peak = lag

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
export function rateFromEnvelope(env: Float64Array, sampleRate: number): Estimate | undefined {
  const size = Math.round(WINDOW_S * sampleRate)
  const rates: number[] = []
  const confidences: number[] = []

  for (let start = 0; start + size <= env.length; start += size) {
    const got = windowEstimate(env.subarray(start, start + size), sampleRate)
    if (!got) continue
    rates.push(got.pulsesPerS)
    confidences.push(got.confidence)
  }

  if (!rates.length) return undefined
  return {pulsesPerS: median(rates), confidence: median(confidences)}
}
