/**
 * The face of the tachometer, as arithmetic.
 *
 * Separate from `Tacho` for the same reason `tick.ts` is separate from the
 * waveform: the geometry is the part that can be wrong in a way a test can
 * catch, and it should not need a canvas to say so.
 */
import {MIN_RATE} from '../dsp/autocorr'
import {MAX_RPM, REVS_PER_PULSE} from '../dsp/types'

/** Clockwise from three o'clock: the sweep starts low-left and ends low-right. */
export const START_ANGLE = 150
export const SWEEP = 240

/** Below this the estimator has nothing to say; see `MIN_RATE`. */
export const FLOOR_RPM = MIN_RATE * 60 * REVS_PER_PULSE

/** One major tick per thousand. Twelve of them, plus zero. */
export const MAJOR_STEP = 1000
export const MINOR_STEP = 500

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * Degrees, clockwise from three o'clock, across a face that ends at `maxRpm`.
 *
 * Clamped, which is the whole of what a reading past the end of the face does:
 * the needle sits on the stop. The figure under the dial is not clamped, so a
 * rider with a 9,000 face who revs to 10,200 sees the needle pinned and the
 * number telling them by how much.
 */
export function rpmToAngle(rpm: number, maxRpm: number = MAX_RPM): number {
  return START_ANGLE + (clamp(rpm, 0, maxRpm) / maxRpm) * SWEEP
}

export const rad = (deg: number) => (deg * Math.PI) / 180

/**
 * The largest dial that fits a box, and where its centre goes.
 *
 * Not `min(w, h) / 2`. A 240-degree sweep is two radii wide but only 1.87 tall
 * — the open quarter at the bottom costs nothing — so a box wider than it is
 * tall can hold a noticeably bigger dial than a circle would. The centre then
 * shifts down by half of what the missing bottom would have taken, so the
 * drawing sits in the middle of the box rather than the circle doing so.
 */
export function faceIn(width: number, height: number, margin: number) {
  const bottom = Math.cos(rad(SWEEP / 2 - 90)) // how far below centre the sweep reaches, in radii
  const r = Math.min(width / 2, height / (1 + bottom)) - margin
  return {r, cx: width / 2, cy: height / 2 + (r * (1 - bottom)) / 2}
}
