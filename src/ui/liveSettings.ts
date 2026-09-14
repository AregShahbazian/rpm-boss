/**
 * What a rider can say about how the tachometer behaves.
 *
 * One thing, now. There was a second — what the needle should do when a window
 * yields no reading — and holding the last value was tried and dropped: a dial
 * that goes on showing a number the engine is no longer turning at is worse
 * than one that admits it has lost the sound. Falling to zero is the only
 * behaviour, not the default of two.
 *
 * The storage is `prefs.ts`, which this file used to hold its own copy of.
 */
import {readChoice, useChoice} from './prefs'

/** How the needle travels between two readings. */
export type Motion = 'smooth' | 'step'

export const MOTIONS: readonly Motion[] = ['smooth', 'step']

/** Readings arrive every 200 ms; without easing the needle visibly ticks. */
export const DEFAULT_MOTION: Motion = 'smooth'

const MOTION_KEY = 'rpm-boss.live.motion'

export const readMotion = (): Motion => readChoice(MOTION_KEY, MOTIONS, DEFAULT_MOTION)

export const useMotion = (): [Motion, (next: Motion) => void] => useChoice(MOTION_KEY, MOTIONS, DEFAULT_MOTION)
