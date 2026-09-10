/**
 * Combustion positions by peak picking, the reference's method A.
 *
 * Two jobs: a second rate estimate that has to agree with the autocorrelation,
 * and the positions phase 5 draws on the waveform. Not to be confused with
 * `src/waveform/peaks.ts`, which reduces samples to columns for drawing.
 *
 * Follows `scipy.signal.find_peaks` closely enough to be checked against it:
 * local maxima, then a minimum spacing, then a minimum prominence, in that
 * order.
 */

/** Peaks must be at least this fraction of a period apart. */
export const MIN_SPACING_PERIODS = 0.6
/** And must stand this many standard deviations clear of their surroundings. */
export const MIN_PROMINENCE_STDDEV = 0.5

/** Indices of local maxima; a plateau reports its midpoint, as scipy does. */
export function localMaxima(x: Float64Array): number[] {
  const out: number[] = []
  let i = 1
  while (i < x.length - 1) {
    if (x[i] <= x[i - 1]) {
      i++
      continue
    }
    let end = i
    while (end < x.length - 1 && x[end + 1] === x[i]) end++
    if (x[end] > x[end + 1]) out.push((i + end) >> 1)
    i = end + 1
  }
  return out
}

/**
 * How far each peak stands above the higher of the two valleys that separate
 * it from any taller ground, which is what scipy calls prominence.
 */
export function prominences(x: Float64Array, peaks: readonly number[]): number[] {
  return peaks.map((peak) => {
    const height = x[peak]

    let leftMin = height
    for (let i = peak; i >= 0; i--) {
      if (x[i] > height) break
      if (x[i] < leftMin) leftMin = x[i]
    }

    let rightMin = height
    for (let i = peak; i < x.length; i++) {
      if (x[i] > height) break
      if (x[i] < rightMin) rightMin = x[i]
    }

    return height - Math.max(leftMin, rightMin)
  })
}

/** Keep the tallest peak, drop everything within `spacing` of it, repeat. */
export function enforceSpacing(x: Float64Array, peaks: readonly number[], spacing: number): number[] {
  const byHeight = [...peaks].sort((a, b) => x[b] - x[a])
  const kept: number[] = []
  for (const peak of byHeight) {
    if (kept.every((other) => Math.abs(other - peak) >= spacing)) kept.push(peak)
  }
  return kept.sort((a, b) => a - b)
}

function standardDeviation(x: Float64Array): number {
  let mean = 0
  for (const v of x) mean += v
  mean /= x.length
  let variance = 0
  for (const v of x) variance += (v - mean) ** 2
  return Math.sqrt(variance / x.length)
}

/**
 * Combustion sample positions in `env`, given the rate the autocorrelation
 * found. The rate sets the spacing, so the two methods are not independent;
 * that is the reference's design, and their agreement is still a real check
 * because the peak count comes from the envelope, not from the rate.
 */
export function findPulses(env: Float64Array, pulsesPerS: number, sampleRate: number): number[] {
  const spacing = Math.max(1, Math.floor((MIN_SPACING_PERIODS * sampleRate) / pulsesPerS))
  const minProminence = MIN_PROMINENCE_STDDEV * standardDeviation(env)

  const spaced = enforceSpacing(env, localMaxima(env), spacing)
  const scores = prominences(env, spaced)
  return spaced.filter((_, i) => scores[i] >= minProminence)
}

/** The second rate estimate: pulses counted over the clip's own length. */
export function rateFromPulses(pulseCount: number, sampleCount: number, sampleRate: number): number {
  return pulseCount / (sampleCount / sampleRate)
}
