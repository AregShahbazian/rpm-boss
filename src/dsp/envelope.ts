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
import { filtfilt, highpass, lowpass } from './biquad'

/** Combustion energy sits inside this band; below is handling noise, above is tone. */
export const BAND_LOW_HZ = 60
export const BAND_HIGH_HZ = 2000
/** Smoothing for the rectified signal. Well above the ~15 Hz pulse rate. */
export const ENVELOPE_HZ = 150

export function envelope(samples: Float32Array | Float64Array, sampleRate: number): Float64Array {
  const band = [highpass(BAND_LOW_HZ, sampleRate), lowpass(BAND_HIGH_HZ, sampleRate)]
  const filtered = filtfilt(band, Float64Array.from(samples))
  for (let i = 0; i < filtered.length; i++) filtered[i] = Math.abs(filtered[i])
  return filtfilt([lowpass(ENVELOPE_HZ, sampleRate)], filtered)
}
