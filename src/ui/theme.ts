import { useCallback, useEffect, useState } from 'react'

export type Theme = 'system' | 'light' | 'dark'

export const THEMES: readonly Theme[] = ['system', 'light', 'dark']

const STORAGE_KEY = 'rpm-boss.theme'

/**
 * Dark unless someone says otherwise.
 *
 * Not `system`. `prefers-color-scheme: no-preference` was removed from the
 * spec, so a browser answers `light` both when the user chose light and when
 * they chose nothing at all; the two cannot be told apart. Defaulting to
 * `system` would therefore put most phones on the light theme, which is the
 * opposite of what this app wants. `system` stays available as a deliberate
 * choice.
 */
export const DEFAULT_THEME: Theme = 'dark'

const isTheme = (v: unknown): v is Theme => typeof v === 'string' && (THEMES as readonly string[]).includes(v)

/** Storage can throw in a private window, and a preference is not worth an error. */
export function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isTheme(stored) ? stored : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

function writeTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // no persistence available; the choice still holds for this session
  }
}

/**
 * Stamps the choice on the root element.
 *
 * All three values are stamped, `system` included, so the stylesheet can scope
 * its `prefers-color-scheme` query to that one case and leave the bare `:root`
 * as the dark default. `color-scheme` follows so that native controls, the
 * scrollbars and the file picker are drawn in the same theme as the app.
 */
export function applyTheme(theme: Theme, root: HTMLElement): void {
  root.dataset.theme = theme
  root.style.colorScheme = theme === 'system' ? 'light dark' : theme
}

export function useTheme(): [Theme, (next: Theme) => void] {
  const [theme, setThemeState] = useState(readTheme)

  useEffect(() => {
    applyTheme(theme, document.documentElement)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    writeTheme(next)
    setThemeState(next)
  }, [])

  return [theme, setTheme]
}
