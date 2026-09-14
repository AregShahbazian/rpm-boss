/**
 * What a rider can say about how the tachometer behaves.
 *
 * One thing, now. There was a second — what the needle should do when a window
 * yields no reading — and holding the last value was tried and dropped: a dial
 * that goes on showing a number the engine is no longer turning at is worse
 * than one that admits it has lost the sound. Falling to zero is the only
 * behaviour, not the default of two.
 *
 * `theme.ts` is the model here, down to the tolerance for storage that throws:
 * a preference is not worth an error, and a private window that refuses
 * `localStorage` should still get a working app.
 */
import {useCallback, useState} from 'react'

/** How the needle travels between two readings. */
export type Motion = 'smooth' | 'step'

export const MOTIONS: readonly Motion[] = ['smooth', 'step']

/** Readings arrive every 200 ms; without easing the needle visibly ticks. */
export const DEFAULT_MOTION: Motion = 'smooth'

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

export const readMotion = (): Motion => read(MOTION_KEY, MOTIONS, DEFAULT_MOTION)

export function useMotion(): [Motion, (next: Motion) => void] {
  const [value, setValue] = useState(readMotion)
  const set = useCallback((next: Motion) => {
    write(MOTION_KEY, next)
    setValue(next)
  }, [])
  return [value, set]
}
