/**
 * The dial.
 *
 * Drawn rather than installed. Every React gauge worth the name depends on d3
 * and re-renders SVG through React per value, which is the wrong shape for a
 * needle following a live engine in a WebView and several times the size of
 * this whole app. What a tachometer is, is arcs, ticks and a needle.
 *
 * It scales to whatever box it is given — the radius comes from the shorter of
 * the two dimensions — so a landscape phone and a tablet get the same drawing
 * at different sizes, with no second set of numbers.
 */
import {useEffect, useRef} from 'react'
import {MAX_RPM, REDLINE_RPM} from '../dsp/types'
import {clamp, faceIn, FLOOR_RPM, MAJOR_STEP, MINOR_STEP, rad, rpmToAngle} from './dial'
import type {Motion} from './liveSettings'
import {usePalette} from './palette'
import {useElementSize} from './useElementSize'

interface Props {
  /** Where to point, or undefined for "nothing to say", which is zero. */
  rpm?: number
  motion: Motion
  /** Where the face ends, and where it turns red. Both the rider's; see `liveSettings`. */
  maxRpm?: number
  redlineRpm?: number
}

/** How fast the needle closes the gap to a new reading, in milliseconds. */
const TAU = 120
/** Near enough that another frame would not be visible. */
const SETTLED_RPM = 0.1

export function Tacho({rpm, motion, maxRpm = MAX_RPM, redlineRpm = REDLINE_RPM}: Props) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [measure, size] = useElementSize()
  const palette = usePalette()
  const drawn = useRef(0)
  const dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1

  useEffect(() => {
    const cv = canvas.current
    if (!cv || size.width === 0 || size.height === 0) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const w = cv.width
    const h = cv.height
    const line = Math.max(2 * dpr, Math.min(w, h) * 0.02)
    const {r, cx, cy} = faceIn(w, h, line * 2)
    if (r <= 0) return

    const arc = (fromRpm: number, toRpm: number, colour: string, alpha = 1) => {
      ctx.globalAlpha = alpha
      ctx.strokeStyle = colour
      ctx.lineWidth = line
      ctx.beginPath()
      ctx.arc(cx, cy, r, rad(rpmToAngle(fromRpm, maxRpm)), rad(rpmToAngle(toRpm, maxRpm)))
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    const draw = (value: number) => {
      ctx.clearRect(0, 0, w, h)

      arc(0, maxRpm, palette.muted)
      // The part of the sweep the estimator cannot reach. Dimmed rather than
      // hidden, so it reads as "not measurable here" and not as "stopped".
      arc(0, FLOOR_RPM, palette.muted, 0.25)
      arc(redlineRpm, maxRpm, palette.error)

      ctx.lineCap = 'butt'
      for (let at = 0; at <= maxRpm; at += MINOR_STEP) {
        const major = at % MAJOR_STEP === 0
        const a = rad(rpmToAngle(at, maxRpm))
        const inner = r - (major ? line * 2.4 : line * 1.3)
        ctx.strokeStyle = palette.muted
        ctx.lineWidth = major ? Math.max(1, line * 0.35) : Math.max(1, line * 0.2)
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(a) * (r - line / 2), cy + Math.sin(a) * (r - line / 2))
        ctx.lineTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner)
        ctx.stroke()
      }

      // Thousands, not the figures themselves: "1" beside a tick is read as a
      // thousand on every tachometer a rider has seen, and the full number
      // would not fit between two ticks on a phone.
      ctx.fillStyle = palette.fg
      ctx.font = `${Math.max(8 * dpr, r * 0.13)}px system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const labelR = r - line * 4.2
      for (let at = 0; at <= maxRpm; at += MAJOR_STEP) {
        const a = rad(rpmToAngle(at, maxRpm))
        ctx.fillText(String(at / MAJOR_STEP), cx + Math.cos(a) * labelR, cy + Math.sin(a) * labelR)
      }

      const a = rad(rpmToAngle(value, maxRpm))
      ctx.strokeStyle = palette.accent
      ctx.lineWidth = Math.max(2, line * 0.6)
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(cx - Math.cos(a) * r * 0.12, cy - Math.sin(a) * r * 0.12)
      ctx.lineTo(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82)
      ctx.stroke()
      ctx.fillStyle = palette.accent
      ctx.beginPath()
      ctx.arc(cx, cy, Math.max(3, line * 0.9), 0, Math.PI * 2)
      ctx.fill()
    }

    const target = clamp(rpm ?? 0, 0, maxRpm)

    if (motion === 'step') {
      drawn.current = target
      draw(target)
      return
    }

    // Easing, not a transition: readings land about five times a second and a
    // needle that teleported between them would tick visibly. The loop parks
    // itself once it arrives, so a screen with a steady engine on it schedules
    // no frames at all.
    let frame = 0
    let last = performance.now()
    const step = (now: number) => {
      const dt = now - last
      last = now
      drawn.current += (target - drawn.current) * (1 - Math.exp(-dt / TAU))
      if (Math.abs(target - drawn.current) < SETTLED_RPM) drawn.current = target
      draw(drawn.current)
      if (drawn.current !== target) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [rpm, motion, maxRpm, redlineRpm, size, palette, dpr])

  return (
    <div ref={measure} className="relative size-full">
      <canvas
        ref={canvas}
        width={Math.round(size.width * dpr)}
        height={Math.round(size.height * dpr)}
        className="absolute inset-0 size-full"
      />
    </div>
  )
}
