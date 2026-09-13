/**
 * The incoming audio, drawn as an oscilloscope.
 *
 * Not the waveform of a clip: there is no clip and no time axis to crop, only
 * the last fraction of a second, redrawn as fast as the screen refreshes. It
 * is here to show that the microphone is alive and roughly how hard it is
 * being driven, so it auto-scales — an idling engine two metres away is quiet
 * enough that a fixed scale would draw a flat line.
 */
import { useEffect, useRef } from 'react'
import { SAMPLE_RATE } from '../audio/types'
import { LIVE_SCOPE_S, type Ring } from '../live/ring'
import { usePalette } from './palette'
import { useElementSize } from './useElementSize'

interface Props {
  /** Filled by `useLive`; undefined until the capture starts. */
  ring: React.RefObject<Ring | undefined>
}

/** Below this the tail is treated as silence and drawn flat, not amplified. */
const NOISE_FLOOR = 0.002

export function LiveScope({ ring }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [measure, size] = useElementSize()
  const palette = usePalette()
  const dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1

  useEffect(() => {
    const cv = canvas.current
    if (!cv || size.width === 0 || size.height === 0) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const tail = new Float32Array(Math.round(LIVE_SCOPE_S * SAMPLE_RATE))
    let frame = 0

    const draw = () => {
      frame = requestAnimationFrame(draw)
      const w = cv.width
      const h = cv.height
      ctx.clearRect(0, 0, w, h)

      const mid = h / 2
      ctx.fillStyle = palette.muted
      ctx.fillRect(0, mid, w, Math.max(1, dpr))
      if (!ring.current) return
      ring.current.latest(tail)

      // One column per device pixel, each the min and max of the samples
      // behind it. Cheaper than a polyline and it keeps the peaks, which a
      // decimating line drops.
      const per = tail.length / w
      let peak = 0
      for (let i = 0; i < tail.length; i++) peak = Math.max(peak, Math.abs(tail[i]))
      const gain = peak > NOISE_FLOOR ? 0.92 / peak : 0

      ctx.fillStyle = palette.accent
      for (let c = 0; c < w; c++) {
        const from = Math.floor(c * per)
        const to = Math.min(tail.length, Math.floor((c + 1) * per))
        let lo = 0
        let hi = 0
        for (let i = from; i < to; i++) {
          if (tail[i] < lo) lo = tail[i]
          if (tail[i] > hi) hi = tail[i]
        }
        const top = mid - hi * gain * mid
        const bottom = mid - lo * gain * mid
        ctx.fillRect(c, top, 1, Math.max(1, bottom - top))
      }
    }

    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [ring, size, palette, dpr])

  return (
    <div className="wave live-scope" ref={measure}>
      <canvas ref={canvas} width={Math.round(size.width * dpr)} height={Math.round(size.height * dpr)} />
    </div>
  )
}
