/**
 * The two things a rider can say about how the tachometer behaves.
 *
 * Both exist because the estimator is not continuous: it produces a reading
 * about five times a second, and sometimes none at all. Neither answer to that
 * is obviously right — a needle that falls to zero the moment an engine is
 * blipped is honest and jumpy; one that holds is steady and occasionally
 * lying — so the choice is the user's, with the honest one as the default.
 *
 * `theme.ts` is the model here, down to the tolerance for storage that throws:
 * a preference is not worth an error, and a private window that refuses
 * `localStorage` should still get a working app.
 */
import {useCallback, useState} from 'react'

/** What the needle does when a window yields no reading. */
export type Fallback = 'zero' | 'hold'
/** How the needle travels between two readings. */
export type Motion = 'smooth' | 'step'

export const FALLBACKS: readonly Fallback[] = ['zero', 'hold']
export const MOTIONS: readonly Motion[] = ['smooth', 'step']

/** Honest over steady: a dial that holds a number the engine is no longer turning at is worse. */
export const DEFAULT_FALLBACK: Fallback = 'zero'
/** Readings arrive every 200 ms; without easing the needle visibly ticks. */
export const DEFAULT_MOTION: Motion = 'smooth'

const FALLBACK_KEY = 'rpm-boss.live.fallback'
const MOTION_KEY = 'rpm-boss.live.motion'

function read<T extends string>(key: string, values: readonly T[], fallback: T): T {
  try {
    const stored = localStorage.getItem(key)
    return values.includes(stored as T) ? (stored as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // no persistence available; the choice still holds for this session
  }
}

export const readFallback = (): Fallback => read(FALLBACK_KEY, FALLBACKS, DEFAULT_FALLBACK)
export const readMotion = (): Motion => read(MOTION_KEY, MOTIONS, DEFAULT_MOTION)

export function useFallback(): [Fallback, (next: Fallback) => void] {
  const [value, setValue] = useState(readFallback)
  const set = useCallback((next: Fallback) => {
    write(FALLBACK_KEY, next)
    setValue(next)
  }, [])
  return [value, set]
}

export function useMotion(): [Motion, (next: Motion) => void] {
  const [value, setValue] = useState(readMotion)
  const set = useCallback((next: Motion) => {
    write(MOTION_KEY, next)
    setValue(next)
  }, [])
  return [value, set]
}
