import { useEffect, useMemo, useState } from 'react'

export interface Palette {
  muted: string
  bg: string
  accent: string
  error: string
  /** How much of the background is laid over the audio outside the window. */
  dim: number
}

function cssVar(name: string, fallback: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

/**
 * Canvas colours from the stylesheet, read once per theme rather than per
 * frame: `getComputedStyle` forces a style recalculation, and the draw effects
 * run on playback frames.
 *
 * The values come from the CSS variables, which the stylesheet has already
 * switched. Two things can switch them: the device's colour scheme, and the
 * `data-theme` attribute the settings write on the root element. The counter
 * exists only to tie the read to both and make it happen again.
 */
export function usePalette(): Palette {
  const [epoch, setEpoch] = useState(0)

  useEffect(() => {
    const bump = () => setEpoch((n) => n + 1)
    const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : undefined
    mq?.addEventListener('change', bump)
    const observer = new MutationObserver(bump)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => {
      mq?.removeEventListener('change', bump)
      observer.disconnect()
    }
  }, [])

  return useMemo(() => {
    void epoch
    return {
      muted: cssVar('--muted', '#888'),
      bg: cssVar('--bg', '#fff'),
      accent: cssVar('--accent', '#1f4e79'),
      error: cssVar('--error', '#b3261e'),
      dim: Number(cssVar('--dim', '0.6')) || 0.6,
    }
  }, [epoch])
}
