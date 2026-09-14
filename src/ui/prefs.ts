/**
 * A choice the app remembers, and the only place that talks to `localStorage`
 * about one.
 *
 * Three settings now keep a value between visits and each had written its own
 * copy of the same twelve lines: read, validate against the allowed values,
 * fall back, and swallow whatever storage threw. The third copy is where a
 * pattern stops being a coincidence.
 *
 * Storage that throws is tolerated on purpose, everywhere: a private window
 * refuses `localStorage` outright, and a preference is not worth an error. The
 * choice still holds for the session — it is only the remembering that is lost.
 *
 * `theme.ts` keeps its own copy: it is not only stored but stamped on the root
 * element and pushed to the Android system bars, so what it shares with these
 * is the smaller half of it.
 */
import {useCallback, useSyncExternalStore} from 'react'

/** The stored value if it is one of the choices, the fallback otherwise. */
export function readChoice<T extends string>(key: string, values: readonly T[], fallback: T): T {
  try {
    const stored = localStorage.getItem(key)
    return values.includes(stored as T) ? (stored as T) : fallback
  } catch {
    return fallback
  }
}

export function writeChoice(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // no persistence available; the choice still holds for this session
  }
}

/** A number preference's bounds, and what it is when nothing is stored. */
export interface NumberBounds {
  min: number
  max: number
  fallback: number
}

/**
 * The stored number, held inside its bounds.
 *
 * Clamped on the way out rather than only on the way in: the bounds move. The
 * redline's ceiling is whatever the dial's top is set to, so a redline stored
 * legitimately at 9,000 is out of range the moment the dial is set to 9,000
 * or below, and the reader is the only place that can know.
 */
export function readNumber(key: string, bounds: NumberBounds): number {
  try {
    const stored = localStorage.getItem(key)
    // Not `Number(stored)` alone: `Number(null)` and `Number('')` are both 0,
    // which is finite, so nothing stored at all would read as zero and clamp
    // to the minimum — a fresh install with the smallest dial the app allows.
    if (stored === null || stored.trim() === '') return bounds.fallback
    const parsed = Number(stored)
    if (!Number.isFinite(parsed)) return bounds.fallback
    return Math.min(bounds.max, Math.max(bounds.min, parsed))
  } catch {
    return bounds.fallback
  }
}

/**
 * Everyone who asks for a preference reads the same one.
 *
 * With `useState` each caller held a private copy: the settings dialog would
 * change its own and the screen, holding another, would never hear. Storage is
 * the value and the components are views of it, so the state lives where all
 * of them can see it. One listener set for every key — a change re-reads them
 * all, and React drops the renders where nothing moved.
 */
const listeners = new Set<() => void>()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}

/** The same pair, for a number. `bounds` is read on every render, so it may move. */
export function useNumber(key: string, bounds: NumberBounds): [number, (next: number) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => readNumber(key, bounds),
    () => bounds.fallback,
  )
  const set = useCallback(
    (next: number) => {
      writeChoice(key, String(next))
      for (const listener of [...listeners]) listener()
    },
    [key],
  )
  return [value, set]
}

/** The pair a settings control wants: what is chosen, and how to change it. */
export function useChoice<T extends string>(
  key: string,
  values: readonly T[],
  fallback: T,
): [T, (next: T) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => readChoice(key, values, fallback),
    () => fallback,
  )
  const set = useCallback(
    (next: T) => {
      writeChoice(key, next)
      for (const listener of [...listeners]) listener()
    },
    [key],
  )
  return [value, set]
}
