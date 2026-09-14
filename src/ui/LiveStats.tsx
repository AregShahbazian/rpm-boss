/**
 * What the feature costs, on the screen it costs it on.
 *
 * A developer's readout, shown only with `FEATURES.mockLive` and never
 * translated. It exists to answer one question — whether the phone keeps up
 * with an analysis every 200 ms — and `skipped` is the answer: ticks that
 * arrived while the previous analysis was still running. Zero means it keeps
 * up. `capture` should sit at 1.00; below it, the microphone path is dropping
 * audio, which is a different failure from the analysis being slow.
 *
 * `fps` is measured here rather than in the scope, because it is the scope's
 * own redraw rate that matters and this sits over it.
 */
import {useEffect, useRef, useState} from 'react'
import type {LiveStats as Stats} from '../state/useLive'

export function LiveStats({stats}: { stats: Stats }) {
  const [fps, setFps] = useState(0)
  const frames = useRef(0)

  useEffect(() => {
    let raf = 0
    const count = () => {
      frames.current++
      raf = requestAnimationFrame(count)
    }
    raf = requestAnimationFrame(count)
    const timer = setInterval(() => {
      setFps(frames.current)
      frames.current = 0
    }, 1000)
    return () => {
      cancelAnimationFrame(raf)
      clearInterval(timer)
    }
  }, [])

  return (
    <p className="pointer-events-none absolute inset-x-0 top-0 z-10 m-0 text-[0.7rem]/[1.4] tabular-nums text-muted" dir="ltr">
      {stats.runs} runs · {stats.lastMs.toFixed(0)} ms last · {stats.avgMs.toFixed(0)} avg ·{' '}
      {stats.maxMs.toFixed(0)} max · {stats.skipped} skipped · {stats.captureRatio.toFixed(2)} capture · {fps} fps
    </p>
  )
}
