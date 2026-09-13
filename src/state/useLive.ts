/**
 * Live RPM: the microphone into a sliding window, the window into the same
 * analysis the Calculate button runs, five times a second.
 *
 * This is a proof of concept, and the question it exists to answer is whether
 * a phone keeps up. So it measures itself — how long each analysis takes, how
 * many ticks had to be skipped because the last one was still running, and
 * whether the microphone is actually delivering audio as fast as the clock
 * runs. Those three numbers are the result of the experiment; the RPM is what
 * makes them worth having.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { createAnalysisClient, type AnalysisClient } from '../analysis/client'
import { InputError, SAMPLE_RATE, type InputErrorCode } from '../audio/types'
import { median } from '../dsp/autocorr'
import type { AnalysisErrorCode } from '../dsp/types'
import { LIVE_INTERVAL_MS, LIVE_SMOOTH_N, LIVE_WINDOW_S, Ring } from '../live/ring'
import { startLiveCapture, type LiveCapture } from '../live/stream'

export interface LiveStats {
  /** Analyses that finished. */
  runs: number
  /** Wall time of the last one, in milliseconds. */
  lastMs: number
  /** Mean wall time over every run so far. */
  avgMs: number
  /** The worst one. A phone that mostly keeps up but stutters shows it here. */
  maxMs: number
  /**
   * Ticks that fired while the previous analysis was still running. The
   * headline number of the experiment: zero means the device keeps up at this
   * window and interval, and a rising count means it does not.
   */
  skipped: number
  /**
   * Seconds of audio received per second of wall time. Should sit at 1.00. A
   * number below it means the microphone path itself is dropping audio, which
   * is a different failure from the analysis being slow.
   */
  captureRatio: number
}

export interface LiveState {
  status: 'off' | 'starting' | 'listening' | 'error'
  /** Median of the last few readings. See `LIVE_SMOOTH_N`. */
  rpm?: number
  /** The most recent reading on its own, unsmoothed. */
  rawRpm?: number
  confidence?: number
  /** Why the last analysis produced nothing — usually `no-signal`. */
  quiet?: AnalysisErrorCode
  errorCode?: InputErrorCode
  /** Which microphone source the platform opened. */
  source?: string
  stats: LiveStats
}

const ZERO_STATS: LiveStats = { runs: 0, lastMs: 0, avgMs: 0, maxMs: 0, skipped: 0, captureRatio: 0 }
const OFF: LiveState = { status: 'off', stats: ZERO_STATS }

export function useLive() {
  const [state, setState] = useState<LiveState>(OFF)
  const ring = useRef<Ring>(undefined)
  const capture = useRef<LiveCapture>(undefined)
  const client = useRef<AnalysisClient>(undefined)
  const timer = useRef<ReturnType<typeof setInterval>>(undefined)
  const running = useRef(false)
  const recent = useRef<number[]>([])
  const totals = useRef({ runs: 0, sumMs: 0, maxMs: 0, skipped: 0, frames: 0, startedAt: 0 })

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current)
    timer.current = undefined
    capture.current?.stop()
    capture.current = undefined
    client.current?.dispose()
    client.current = undefined
    ring.current = undefined
    running.current = false
    recent.current = []
    setState(OFF)
  }, [])

  // Nothing here survives the screen going away, and the microphone least of
  // all: a live capture left open holds the device's microphone against every
  // other app.
  useEffect(() => stop, [stop])

  const start = useCallback(() => {
    if (capture.current) return
    const buffer = new Ring()
    ring.current = buffer
    recent.current = []
    totals.current = { runs: 0, sumMs: 0, maxMs: 0, skipped: 0, frames: 0, startedAt: performance.now() }
    setState({ status: 'starting', stats: ZERO_STATS })

    client.current = createAnalysisClient()
    capture.current = startLiveCapture({
      onChunk: (samples) => {
        buffer.push(samples)
        totals.current.frames += samples.length
      },
      onOpen: ({ source }) => setState((prev) => ({ ...prev, status: 'listening', source })),
      onError: (err: InputError) => {
        stop()
        setState({ status: 'error', errorCode: err.code, stats: ZERO_STATS })
      },
    })

    timer.current = setInterval(() => {
      const t = totals.current
      const elapsedS = (performance.now() - t.startedAt) / 1000
      const captureRatio = elapsedS > 0 ? t.frames / SAMPLE_RATE / elapsedS : 0

      // Not full yet: the window would be part silence, and silence prepended
      // to an engine is a different sound from an engine.
      if (!buffer.full) return
      if (running.current) {
        t.skipped++
        return
      }
      running.current = true

      const startedAt = performance.now()
      // The snapshot buffer is reused, and `run` structured-clones it on the
      // way into the worker, so there is nothing to wait for here.
      const window = buffer.snapshot()
      void client.current
        ?.run({
          sampleRate: SAMPLE_RATE,
          samples: window,
          durationS: LIVE_WINDOW_S,
          source: { kind: 'mic', name: 'live' },
        })
        .then((result) => {
          running.current = false
          const ms = performance.now() - startedAt
          t.runs++
          t.sumMs += ms
          t.maxMs = Math.max(t.maxMs, ms)

          const stats: LiveStats = {
            runs: t.runs,
            lastMs: ms,
            avgMs: t.sumMs / t.runs,
            maxMs: t.maxMs,
            skipped: t.skipped,
            captureRatio,
          }

          if (!result.ok) {
            // The engine stopping is not an error, so the last number is left
            // on screen rather than blanked on one quiet window.
            setState((prev) => ({ ...prev, status: 'listening', quiet: result.code, stats }))
            return
          }

          // Median, not a running average: when the method is wrong it is
          // wrong by a whole octave, and an average of 1400 and 2800 is a
          // number the engine never turned at. A median ignores the outlier.
          const history = recent.current
          history.push(result.rpm)
          if (history.length > LIVE_SMOOTH_N) history.shift()

          setState((prev) => ({
            ...prev,
            status: 'listening',
            rpm: median(history),
            rawRpm: result.rpm,
            confidence: result.confidence,
            quiet: undefined,
            stats,
          }))
        })
    }, LIVE_INTERVAL_MS)
  }, [stop])

  return { live: state, ring, start, stop }
}
