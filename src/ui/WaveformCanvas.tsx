import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AudioClip } from '../audio/types'
import { computePeaks } from '../waveform/peaks'
import { moveBy, setEnd, setStart, type Selection } from '../waveform/selection'

export interface TimeRange {
  fromS: number
  toS: number
}

interface Props {
  clip: AudioClip
  range: TimeRange
  selection: Selection
  onChange: (sel: Selection) => void
  positionS?: number
  handles: boolean
  height: number
}

const EDGE_HIT_PX = 24
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

  // Waveform layer, cached per (range, width, clip).
  const layer = useMemo(() => {
    if (width === 0) return undefined
    const w = Math.round(width * dpr)
    const h = Math.round(height * dpr)
    const off = document.createElement('canvas')
    off.width = w
    off.height = h
    const ctx = off.getContext('2d')
    if (!ctx) return undefined
    const peaks = computePeaks(clip.samples, range.fromS * clip.sampleRate, range.toS * clip.sampleRate, w)
    ctx.fillStyle = wrap.current ? cssVar(wrap.current, '--muted', '#888') : '#888'
    const mid = h / 2
    for (let c = 0; c < w; c++) {
      const top = mid - peaks.max[c] * mid
      const bottom = mid - peaks.min[c] * mid
      ctx.fillRect(c, top, 1, Math.max(1, bottom - top))
    }
    return off
  }, [clip, range.fromS, range.toS, width, height, dpr])

  // Overlay, redrawn on every selection/position change.
  useEffect(() => {
    const cv = canvas.current
    if (!cv || !layer || width === 0) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const raf = requestAnimationFrame(() => {
      const w = cv.width
      const h = cv.height
      ctx.clearRect(0, 0, w, h)
      ctx.drawImage(layer, 0, 0)
      const sx = sToX(selection.startS) * dpr
      const ex = sToX(selection.endS) * dpr
      const bg = cssVar(cv, '--bg', '#fff')
      ctx.globalAlpha = 0.6
      ctx.fillStyle = bg
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
  }, [layer, selection, positionS, handles, width, dpr, sToX, range.fromS, range.toS])

  const localX = (e: React.PointerEvent) => e.clientX - (canvas.current?.getBoundingClientRect().left ?? 0)

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!e.isPrimary || width === 0) return
    const x = localX(e)
    const sx = sToX(selection.startS)
    const ex = sToX(selection.endS)
    let d: Drag | undefined
    if (handles && Math.abs(x - ex) <= EDGE_HIT_PX) d = { kind: 'end' }
    else if (handles && Math.abs(x - sx) <= EDGE_HIT_PX) d = { kind: 'start' }
    else if (x > sx && x < ex) d = { kind: 'body', x0: x, sel0: selection }
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
