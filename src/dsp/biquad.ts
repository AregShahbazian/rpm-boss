/**
 * Second-order sections and zero-phase filtering.
 *
 * Only Butterworth Q (1/sqrt(2)) sections are needed here, designed by the
 * bilinear transform. The coefficients come out identical to
 * `scipy.signal.butter(2, f, fs=sr, output='sos')`, which is what the
 * reference in `scripts/reference/analyse.py` uses.
 */

/** One biquad, `a0` already divided out. */
export interface Section {
  b0: number
  b1: number
  b2: number
  a1: number
  a2: number
}

const BUTTERWORTH_Q = Math.SQRT1_2

function section(cutoffHz: number, sampleRate: number, highpass: boolean): Section {
  if (cutoffHz <= 0 || cutoffHz >= sampleRate / 2) throw new RangeError(`cutoff ${cutoffHz} Hz outside 0..${sampleRate / 2}`)
  const w0 = (2 * Math.PI * cutoffHz) / sampleRate
  const cos = Math.cos(w0)
  const alpha = Math.sin(w0) / (2 * BUTTERWORTH_Q)
  const a0 = 1 + alpha
  const shared = highpass ? (1 + cos) / 2 : (1 - cos) / 2
  return {
    b0: shared / a0,
    b1: (highpass ? -2 * shared : 2 * shared) / a0,
    b2: shared / a0,
    a1: (-2 * cos) / a0,
    a2: (1 - alpha) / a0,
  }
}

export const lowpass = (cutoffHz: number, sampleRate: number): Section => section(cutoffHz, sampleRate, false)
export const highpass = (cutoffHz: number, sampleRate: number): Section => section(cutoffHz, sampleRate, true)

/** Gain at `hz`, for tests and for sanity-checking a band. */
export function magnitude(sections: readonly Section[], hz: number, sampleRate: number): number {
  const w = (2 * Math.PI * hz) / sampleRate
  let gain = 1
  for (const s of sections) {
    // |H(e^jw)| with the numerator and denominator evaluated on the unit circle
    const cos1 = Math.cos(w)
    const cos2 = Math.cos(2 * w)
    const sin1 = Math.sin(w)
    const sin2 = Math.sin(2 * w)
    const numRe = s.b0 + s.b1 * cos1 + s.b2 * cos2
    const numIm = -(s.b1 * sin1 + s.b2 * sin2)
    const denRe = 1 + s.a1 * cos1 + s.a2 * cos2
    const denIm = -(s.a1 * sin1 + s.a2 * sin2)
    gain *= Math.hypot(numRe, numIm) / Math.hypot(denRe, denIm)
  }
  return gain
}

/**
 * Steady state of a section for a constant input of 1, in transposed direct
 * form II. Starting the filter here instead of at zero stops the output
 * ramping up from silence over the first few milliseconds, which matters a
 * great deal on a rectified signal that never goes near zero.
 */
function initialState(s: Section): [number, number] {
  const gain = (s.b0 + s.b1 + s.b2) / (1 + s.a1 + s.a2)
  return [s.b1 + s.b2 - (s.a1 + s.a2) * gain, s.b2 - s.a2 * gain]
}

function runForward(sections: readonly Section[], x: Float64Array, out: Float64Array): void {
  out.set(x)
  for (const s of sections) {
    const [zi1, zi2] = initialState(s)
    let z1 = zi1 * out[0]
    let z2 = zi2 * out[0]
    for (let i = 0; i < out.length; i++) {
      const input = out[i]
      const y = s.b0 * input + z1
      z1 = s.b1 * input - s.a1 * y + z2
      z2 = s.b2 * input - s.a2 * y
      out[i] = y
    }
  }
}

function reverse(x: Float64Array): Float64Array {
  const out = new Float64Array(x.length)
  for (let i = 0; i < x.length; i++) out[i] = x[x.length - 1 - i]
  return out
}

/**
 * Odd extension at both ends, the padding `scipy.signal.sosfiltfilt` applies
 * before filtering. It continues the signal's slope rather than repeating or
 * mirroring it, so the filter does not see a step at the edges.
 */
function oddExtend(x: Float64Array, padLength: number): Float64Array {
  const n = x.length
  const out = new Float64Array(n + 2 * padLength)
  for (let i = 0; i < padLength; i++) {
    out[i] = 2 * x[0] - x[padLength - i]
    out[padLength + n + i] = 2 * x[n - 1] - x[n - 2 - i]
  }
  out.set(x, padLength)
  return out
}

/**
 * Forward then backward through the cascade, so the result has no phase shift
 * and the pulses stay where they were in the recording. Phase 5 draws markers
 * on these positions, so a shifted envelope would be visibly wrong.
 */
export function filtfilt(sections: readonly Section[], x: Float64Array): Float64Array {
  // scipy's sosfiltfilt: edge = 3 * ntaps, ntaps = 2 * n_sections + 1.
  const padLength = 3 * (2 * sections.length + 1)
  if (x.length <= padLength) throw new RangeError(`need more than ${padLength} samples, got ${x.length}`)

  const padded = oddExtend(x, padLength)
  const forward = new Float64Array(padded.length)
  runForward(sections, padded, forward)
  const backward = new Float64Array(padded.length)
  runForward(sections, reverse(forward), backward)

  const flipped = reverse(backward)
  return flipped.slice(padLength, padLength + x.length)
}
