/**
 * The whole chain: samples in, one RPM out.
 *
 * Mirrors `analyse()` in `scripts/reference/analyse.py`, which is what the
 * fixture suite checks this against.
 */
import { rateFromEnvelope } from './autocorr'
import { envelope } from './envelope'
import { findPulses, rateFromPulses } from './pulses'
import {
  failure,
  MIN_ANALYSIS_S,
  MIN_CONFIDENCE,
  REVS_PER_PULSE,
  type Analysis,
  type ExpectedRange,
} from './types'

export const toRpm = (pulsesPerS: number): number => pulsesPerS * 60 * REVS_PER_PULSE

/**
 * When the method is wrong it is wrong by a factor of two: a missed pulse
 * halves the rate, a ringing exhaust doubles it. Given a range from the user,
 * pick whichever of half, the estimate, and double falls inside it. Nothing
 * else about the answer changes, and an unusable range is ignored.
 */
export function resolveOctave(rpm: number, range?: ExpectedRange): number {
  if (!range || !(range.minRpm > 0) || !(range.maxRpm > range.minRpm)) return rpm

  const inside = [rpm / 2, rpm, rpm * 2].filter((c) => c >= range.minRpm && c <= range.maxRpm)
  if (!inside.length) return rpm

  const middle = (range.minRpm + range.maxRpm) / 2
  return inside.reduce((best, c) => (Math.abs(c - middle) < Math.abs(best - middle) ? c : best))
}

export function analyse(
  samples: Float32Array | Float64Array,
  sampleRate: number,
  range?: ExpectedRange,
): Analysis {
  if (samples.length < MIN_ANALYSIS_S * sampleRate) return failure('too-short')

  const env = envelope(samples, sampleRate)
  const estimate = rateFromEnvelope(env, sampleRate)
  if (!estimate || estimate.confidence < MIN_CONFIDENCE) return failure('no-signal')

  const pulses = findPulses(env, estimate.pulsesPerS, sampleRate)
  const rpm = toRpm(estimate.pulsesPerS)
  const resolved = resolveOctave(rpm, range)

  return {
    ok: true,
    rpm: resolved,
    pulsesPerS: estimate.pulsesPerS,
    peakPulsesPerS: rateFromPulses(pulses.length, samples.length, sampleRate),
    confidence: estimate.confidence,
    pulseTimesS: pulses.map((i) => i / sampleRate),
    octaveAdjusted: resolved !== rpm,
  }
}
