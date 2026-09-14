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
import {useCallback, useState} from 'react'

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

/** The pair a settings control wants: what is chosen, and how to change it. */
export function useChoice<T extends string>(
  key: string,
  values: readonly T[],
  fallback: T,
): [T, (next: T) => void] {
  const [value, setValue] = useState(() => readChoice(key, values, fallback))
  const set = useCallback((next: T) => {
    writeChoice(key, next)
    setValue(next)
  }, [key])
  return [value, set]
}
