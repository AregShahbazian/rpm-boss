/**
 * Exhaust envelope: the slow shape of the combustion pulses, with the engine's
 * tone and the room's rumble taken out.
 *
 * The band is a highpass cascaded with a lowpass rather than a true Butterworth
 * bandpass. The two agree to 0.06 rpm across the fixtures, and the cascade is
 * three sections of one shape instead of a pole-mapping routine. The Python
 * baseline in `scripts/reference/analyse.py` was changed to match, so the
 * fixture check grades this chain rather than a near neighbour of it.
 */
import {filtfilt, highpass, lowpass} from './biquad'
import {rateScale, type RevsPerPulse} from './types'

/** Combustion energy sits inside this band; below is handling noise, above is tone. */
export const BAND_LOW_HZ = 60
export const BAND_HIGH_HZ = 2000
/**
 * Smoothing for the rectified signal, on a four-stroke: one and a half times
 * the fastest combustion rate searched, so the top of the dial still comes
 * through as a ripple the correlation can find.
 */
export const ENVELOPE_HZ = 150

/**
 * The same margin above the same top of the dial, for the engine at hand. A
 * two-stroke reaching 12,000 is firing 200 times a second, and a 150 Hz
 * smoothing would take that ripple out before the correlation saw it — which
 * is exactly what happened: past 6,000 the reading fell to a subharmonic.
 */
export const envelopeHzFor = (revsPerPulse: RevsPerPulse): number => ENVELOPE_HZ * rateScale(revsPerPulse)

export function envelope(
  samples: Float32Array | Float64Array,
  sampleRate: number,
  smoothHz: number = ENVELOPE_HZ,
): Float64Array {
  const band = [highpass(BAND_LOW_HZ, sampleRate), lowpass(BAND_HIGH_HZ, sampleRate)]
  const filtered = filtfilt(band, Float64Array.from(samples))
  for (let i = 0; i < filtered.length; i++) filtered[i] = Math.abs(filtered[i])
  return filtfilt([lowpass(smoothHz, sampleRate)], filtered)
}
