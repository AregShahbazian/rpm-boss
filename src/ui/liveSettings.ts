/**
 * What a rider can say about the tachometer: how the needle moves, and what
 * face it moves across.
 *
 * The face was two constants until now. A 0-12,000 dial suits the 110-155 cc
 * singles the app was built for and wastes half its sweep on a bike that
 * never sees 8,000, so where the scale ends and where it turns red are the
 * rider's to say.
 *
 * What they are not is the detector's business. `MAX_RPM` in `dsp/types.ts`
 * stays exactly where it is: it is what the analysis can reach, the rate range
 * is derived from it, and a rider choosing a smaller face is asking for a
 * different drawing, not a deafer app. A reading past the end of the face
 * pins the needle at the stop and prints the real figure underneath — which is
 * what a tachometer does, and why the face can be the smaller of the two.
 *
 * The storage is `prefs.ts`, which this file used to hold its own copy of.
 */
import {MAX_RPM, REDLINE_RPM} from '../dsp/types'
import {type NumberBounds, readChoice, readNumber, useChoice, useNumber} from './prefs'

/** How the needle travels between two readings. */
export type Motion = 'smooth' | 'step'

export const MOTIONS: readonly Motion[] = ['smooth', 'step']

/** Readings arrive every 200 ms; without easing the needle visibly ticks. */
export const DEFAULT_MOTION: Motion = 'smooth'

const MOTION_KEY = 'rpm-boss.live.motion'

export const readMotion = (): Motion => readChoice(MOTION_KEY, MOTIONS, DEFAULT_MOTION)

export const useMotion = (): [Motion, (next: Motion) => void] => useChoice(MOTION_KEY, MOTIONS, DEFAULT_MOTION)

/**
 * The smallest dial worth drawing. Below 9,000 the face would stop short of
 * the redline of every bike in the class this app is for — a Click, a Sniper
 * and a Raider all turn 9,500 to 11,000 — and a gauge whose stop is inside
 * the engine's working range is not a gauge, it is a warning light.
 *
 * The top is `MAX_RPM`, which is what the analysis can read. A face drawn past
 * it would have a stretch at the end the needle could never reach.
 */
export const MAX_RPM_BOUNDS: NumberBounds = {min: 9_000, max: MAX_RPM, fallback: MAX_RPM}

/**
 * The lowest the redline may be set to, and the loosest bound here: 600 is the
 * bottom of what the app can read at all, so this says only that a redline is
 * an rpm the app could show. The useful limit is the other one — a redline can
 * never sit past the end of the face it is drawn on — and that one moves with
 * the dial rather than being stated, so lowering the dial's top brings the
 * redline down with it.
 */
export const REDLINE_MIN = 600

export const redlineBounds = (maxRpm: number): NumberBounds => ({
  min: REDLINE_MIN,
  max: maxRpm,
  fallback: Math.min(REDLINE_RPM, maxRpm),
})

/** Where the dial's numbers stop. */
const MAX_RPM_KEY = 'rpm-boss.dial.maxRpm'
/** Where it turns red. */
const REDLINE_KEY = 'rpm-boss.dial.redline'

export const readMaxRpm = (): number => readNumber(MAX_RPM_KEY, MAX_RPM_BOUNDS)

export const readRedline = (maxRpm: number): number => readNumber(REDLINE_KEY, redlineBounds(maxRpm))

export const useMaxRpm = (): [number, (next: number) => void] => useNumber(MAX_RPM_KEY, MAX_RPM_BOUNDS)

export const useRedline = (maxRpm: number): [number, (next: number) => void] =>
  useNumber(REDLINE_KEY, redlineBounds(maxRpm))
