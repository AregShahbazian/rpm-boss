/**
 * The incoming audio, drawn the way a recording is drawn.
 *
 * Not the waveform of a clip: there is no clip and no time axis to crop, only
 * the last fraction of a second, redrawn as fast as the screen refreshes. It
 * is here to say that the microphone is alive and roughly how hard it is being
 * driven — so it auto-scales, because an engine two metres away is quiet
 * enough that a fixed scale would draw a flat line.
 *
 * Same columns, same colour and same min-to-max bars as `WaveformCanvas`: it
 * is the same signal, seen sooner, and it should not look like a different
 * instrument. What it cannot borrow is that component's rasterising — the
 * signal there is static and drawn once, here it is new every frame.
 */
import {useEffect, useRef} from 'react'
import {SAMPLE_RATE} from '../audio/types'
import {LIVE_SCOPE_S, type Ring} from '../live/ring'
import {computePeaks} from '../waveform/peaks'
import {usePalette} from './palette'
import {useElementSize} from './useElementSize'

interface Props {
  /** Filled by `useLive`; undefined until the capture starts. */
  ring: React.RefObject<Ring | undefined>
}

/** Below this the tail is treated as silence and drawn flat, not amplified. */
const NOISE_FLOOR = 0.002

export function LiveScope({ring}: Props) {
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
      const buffer = ring.current
      const w = cv.width
      const h = cv.height
      ctx.clearRect(0, 0, w, h)
      if (!buffer) return

      buffer.latest(tail)

      // Auto-scale to the loudest thing in the tail. Below the floor there is
      // nothing to look at, and amplifying it would draw the noise of the
      // room as though it were an engine.
      let peak = 0
      for (const v of tail) {
        const a = Math.abs(v)
        if (a > peak) peak = a
      }
      const gain = peak > NOISE_FLOOR ? 0.95 / peak : 0

      const peaks = computePeaks(tail, 0, tail.length, w)
      const mid = h / 2
      ctx.fillStyle = palette.muted
      for (let c = 0; c < w; c++) {
        const top = mid - peaks.max[c] * gain * mid
        const bottom = mid - peaks.min[c] * gain * mid
        ctx.fillRect(c, top, 1, Math.max(1, bottom - top))
      }
    }

    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [ring, size, palette, dpr])

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
