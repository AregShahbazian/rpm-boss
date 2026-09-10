import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AudioClip } from '../audio/types'
import { computePeaks } from '../waveform/peaks'
import type { TimeRange } from '../waveform/range'
import { moveBy, setEnd, setStart, type Selection } from '../waveform/selection'

interface Props {
  clip: AudioClip
  range: TimeRange
  selection: Selection
  onChange: (sel: Selection) => void
  positionS?: number
  handles: boolean
  height: number
}

/** How near an edge a press outside the window still grabs that edge. */
const EDGE_HIT_PX = 24
/**
 * The same, for a press *inside* the window. Kept small so a narrow window
 * still has a draggable body: with 24 px on both sides, anything under 48 px
 * wide could only ever be resized.
 */
const EDGE_HIT_INSIDE_PX = 8
type Drag = { kind: 'start' | 'end' } | { kind: 'body'; x0: number; sel0: Selection }

function cssVar(el: Element, name: string, fallback: string) {
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback
}

export function WaveformCanvas({ clip, range, selection, onChange, positionS, handles, height }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [width, setWidth] = useState(0)
  const drag = useRef<Drag | undefined>(undefined)
  const dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)))
    ro.observe(el)
    setWidth(Math.round(el.getBoundingClientRect().width))
    return () => ro.disconnect()
  }, [])

  const spanS = range.toS - range.fromS
  const xToS = useCallback((x: number) => range.fromS + (x / width) * spanS, [range.fromS, spanS, width])
  const sToX = useCallback((s: number) => ((s - range.fromS) / spanS) * width, [range.fromS, spanS, width])

  // Peaks, cached per (range, width, clip). Pure; drawing happens in the effect.
  const peaks = useMemo(() => {
    if (width === 0) return undefined
    const w = Math.round(width * dpr)
    return computePeaks(clip.samples, range.fromS * clip.sampleRate, range.toS * clip.sampleRate, w)
  }, [clip, range.fromS, range.toS, width, dpr])

  // Redrawn on every selection/position change; the waveform itself is ~800 rects, cheap.
  useEffect(() => {
    const cv = canvas.current
    if (!cv || !peaks || width === 0) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const raf = requestAnimationFrame(() => {
      const w = cv.width
      const h = cv.height
      const mid = h / 2
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = cssVar(cv, '--muted', '#888')
      for (let c = 0; c < w; c++) {
        const top = mid - peaks.max[c] * mid
        const bottom = mid - peaks.min[c] * mid
        ctx.fillRect(c, top, 1, Math.max(1, bottom - top))
      }
      const sx = sToX(selection.startS) * dpr
      const ex = sToX(selection.endS) * dpr
      ctx.globalAlpha = 0.6
      ctx.fillStyle = cssVar(cv, '--bg', '#fff')
      if (sx > 0) ctx.fillRect(0, 0, Math.max(0, sx), h)
      if (ex < w) ctx.fillRect(Math.min(w, ex), 0, w - ex, h)
      ctx.globalAlpha = 1
      const accent = cssVar(cv, '--accent', '#1f4e79')
      ctx.strokeStyle = accent
      ctx.lineWidth = 2 * dpr
      ctx.strokeRect(sx, dpr, ex - sx, h - 2 * dpr)
      if (handles) {
        ctx.fillStyle = accent
        const hw = 4 * dpr
        const gh = Math.min(h * 0.5, 28 * dpr)
        for (const x of [sx, ex]) {
          ctx.fillRect(x - hw / 2, 0, hw, h)
          ctx.beginPath()
          ctx.roundRect(x - 6 * dpr, h / 2 - gh / 2, 12 * dpr, gh, 4 * dpr)
          ctx.fill()
        }
      }
      if (positionS !== undefined && positionS >= range.fromS && positionS <= range.toS) {
        ctx.fillStyle = cssVar(cv, '--error', '#b3261e')
        ctx.fillRect(sToX(positionS) * dpr - dpr / 2, 0, Math.max(1, dpr), h)
      }
    })
    return () => cancelAnimationFrame(raf)
  }, [peaks, selection, positionS, handles, width, dpr, sToX, range.fromS, range.toS])

  const localX = (e: React.PointerEvent) => e.clientX - (canvas.current?.getBoundingClientRect().left ?? 0)

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!e.isPrimary || width === 0) return
    const x = localX(e)
    const sx = sToX(selection.startS)
    const ex = sToX(selection.endS)
    let d: Drag | undefined
    const dStart = Math.abs(x - sx)
    const dEnd = Math.abs(x - ex)
    const inside = x > sx && x < ex
    const slack = inside ? EDGE_HIT_INSIDE_PX : EDGE_HIT_PX
    if (handles && Math.min(dStart, dEnd) <= slack) d = { kind: dStart <= dEnd ? 'start' : 'end' }
    else if (inside) d = { kind: 'body', x0: x, sel0: selection }
    else if (!handles) {
      const len = selection.endS - selection.startS
      const centred = moveBy(selection, xToS(x) - len / 2 - selection.startS, clip.durationS)
      onChange(centred)
      d = { kind: 'body', x0: x, sel0: centred }
    }
    if (!d) return
    drag.current = d
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current
    if (!d || !e.isPrimary) return
    const x = localX(e)
    if (d.kind === 'start') onChange(setStart(selection, xToS(x), clip.durationS))
    else if (d.kind === 'end') onChange(setEnd(selection, xToS(x), clip.durationS))
    else if (d.kind === 'body') onChange(moveBy(d.sel0, xToS(x) - xToS(d.x0), clip.durationS))
  }

  const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current) return
    drag.current = undefined
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
  }

  return (
    <div ref={wrap} className="wave" style={{ height }}>
      <canvas
        ref={canvas}
        width={Math.round(width * dpr)}
        height={Math.round(height * dpr)}
        style={{ width: '100%', height }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
    </div>
  )
}
