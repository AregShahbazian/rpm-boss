import { useEffect, useMemo, useRef, useState } from 'react'
import type { AudioClip } from '../audio/types'
import { computePeaks } from '../waveform/peaks'
import { usePalette } from './palette'
import { tickPositions } from './tick'

interface Props {
  clip: AudioClip
  pulseTimesS: readonly number[]
  height?: number
}

/** How far a combustion tick reaches in from the top and bottom edges. */
const TICK_PX = 10

/**
 * The analysed window with a mark on every combustion the analysis found.
 *
 * Not interactive, and deliberately not the crop canvas: on a long clip the
 * crop's detail view spans 30 s, so a 10 s window would be a third of the
 * width and its marks would smear together. This shows the window and nothing
 * else, so the spacing between marks is the spacing between combustions.
 *
 * Ticks sit at the edges rather than crossing the trace: at 13 pulses a second
 * they are about 3 px apart, and full-height lines would erase the waveform.
 * None are thinned out, because an even comb with one gap in it is exactly
 * what tells the user a combustion was missed.
 */
export function ResultWaveform({ clip, pulseTimesS, height = 96 }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [width, setWidth] = useState(0)
  const dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1
  const palette = usePalette()

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)))
    ro.observe(el)
    setWidth(Math.round(el.getBoundingClientRect().width))
    return () => ro.disconnect()
  }, [])

  const peaks = useMemo(() => {
    if (width === 0) return undefined
    return computePeaks(clip.samples, 0, clip.samples.length, Math.round(width * dpr))
  }, [clip, width, dpr])

  useEffect(() => {
    const cv = canvas.current
    if (!cv || !peaks || width === 0) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const w = cv.width
    const h = cv.height
    ctx.clearRect(0, 0, w, h)

    const mid = h / 2
    ctx.fillStyle = palette.muted
    for (let c = 0; c < w; c++) {
      const top = mid - peaks.max[c] * mid
      const bottom = mid - peaks.min[c] * mid
      ctx.fillRect(c, top, 1, Math.max(1, bottom - top))
    }

    ctx.fillStyle = palette.accent
    const tick = TICK_PX * dpr
    for (const x of tickPositions(pulseTimesS, clip.durationS, w)) {
      const at = Math.min(w - dpr, x)
      ctx.fillRect(at, 0, Math.max(1, dpr), tick)
      ctx.fillRect(at, h - tick, Math.max(1, dpr), tick)
    }
    // `height` matters: setting the attribute resets and clears the canvas, so
    // a change to it has to redraw.
  }, [peaks, palette, pulseTimesS, clip.durationS, width, height, dpr])

  return (
    <div className="wave result-wave" ref={wrap}>
      <canvas
        ref={canvas}
        width={Math.round(width * dpr)}
        height={Math.round(height * dpr)}
        style={{ width: '100%', height: `${height}px` }}
      />
    </div>
  )
}
