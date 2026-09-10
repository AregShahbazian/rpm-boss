import { useEffect, useMemo, useState } from 'react'

export interface Palette {
  muted: string
  bg: string
  accent: string
  error: string
}

function cssVar(name: string, fallback: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

function prefersDark() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * Canvas colours from the stylesheet, read once per colour scheme rather than
 * per frame: `getComputedStyle` forces a style recalculation, and the draw
 * effects run on playback frames.
 *
 * The values come from the CSS variables, which the media query has already
 * switched, so the dark flag is only there to tie the read to the scheme and
 * make it happen again when the scheme changes.
 */
export function usePalette(): Palette {
  const [dark, setDark] = useState(prefersDark)

  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setDark(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return useMemo(() => {
    void dark
    return {
      muted: cssVar('--muted', '#888'),
      bg: cssVar('--bg', '#fff'),
      accent: cssVar('--accent', '#1f4e79'),
      error: cssVar('--error', '#b3261e'),
    }
  }, [dark])
}
