/**
 * Live rpm: the microphone into a sliding window, the window into the same
 * analysis the Calculate button runs, five times a second.
 *
 * Nothing is recorded. The ring is the only copy of the audio and it is a
 * fixed size, so a session that runs for an hour costs what one that runs for
 * two seconds costs, and there is nothing at the end of it to save, crop or
 * play back.
 *
 * The hook holds the machinery and reports two things: the last reading that
 * succeeded, and whether the most recent window produced one. What to show
 * when it did not is a question for the settings, and `displayRpm` below is
 * where that question is answered — separately, because it is the only part of
 * this file that can be tested without a microphone.
 */
import {useCallback, useEffect, useRef, useState} from 'react'
import {type AnalysisClient, createAnalysisClient} from '../analysis/client'
import {InputError, type InputErrorCode, SAMPLE_RATE} from '../audio/types'
import {FEATURES} from '../features'
import {median} from '../dsp/autocorr'
import {LIVE_INTERVAL_MS, LIVE_SMOOTH_N, LIVE_WINDOW_S, Ring} from '../live/ring'
import {startMockCapture} from '../live/mock'
import {type LiveCapture, startLiveCapture} from '../live/stream'
import type {Fallback} from '../ui/liveSettings'

/** Where the audio comes from. The only difference between the two. */
export type LiveSource = 'mic' | 'mock'

export type LiveStatus = 'off' | 'starting' | 'listening'

/**
 * What the feature costs, measured while it runs.
 *
 * Only gathered behind `FEATURES.mockLive`, and only read by the developer
 * readout under the scope. The whole design rests on an assumption — that a
 * phone can run the batch analysis five times a second — and `skipped` is the
 * number that says whether it holds: it counts ticks that arrived while the
 * previous analysis was still running, so zero means the device keeps up and a
 * rising count says by how much it does not.
 */
export interface LiveStats {
  runs: number
  lastMs: number
  avgMs: number
  maxMs: number
  skipped: number
  /** Seconds of audio received per second of wall time. Should sit at 1.00. */
  captureRatio: number
}

export interface LiveState {
  status: LiveStatus
  /** The last reading that succeeded: the median of the last `LIVE_SMOOTH_N`. */
  reading?: number
  /** True when the most recent window yielded nothing — silence, or no rhythm in it. */
  quiet: boolean
  stats?: LiveStats
}

const OFF: LiveState = {status: 'off', quiet: false}

/**
 * What the dial should point at, given the state and the preference.
 *
 * `undefined` means "nothing to say", which the screen draws as a needle at
 * zero and a row of dashes — the same thing it draws before live mode starts,
 * so one rendering path covers both.
 */
export function displayRpm(live: LiveState, fallback: Fallback): number | undefined {
  if (live.status !== 'listening') return undefined
  if (!live.quiet) return live.reading
  return fallback === 'hold' ? live.reading : undefined
}

export function useLive(onError: (code: InputErrorCode) => void) {
  const [live, setLive] = useState<LiveState>(OFF)
  const ring = useRef<Ring>(undefined)
  const capture = useRef<LiveCapture>(undefined)
  const client = useRef<AnalysisClient>(undefined)
  const timer = useRef<ReturnType<typeof setInterval>>(undefined)
  const running = useRef(false)
  const recent = useRef<number[]>([])
  /*
   * Which run of live mode a result belongs to.
   *
   * An analysis takes about 60 ms of every 200, so roughly a third of all
   * stops land while one is in flight. Its `then` runs afterwards, against a
   * hook that has already been torn down, and — before this — set the state
   * back to `listening`: stop button still on screen, dial still showing a
   * reading, but the timer cleared, the ring gone and the scope blank. A
   * zombie. Bumping this on every stop is what makes a late result know that
   * nobody is waiting for it.
   */
  const generation = useRef(0)
  const totals = useRef({runs: 0, sumMs: 0, maxMs: 0, skipped: 0, frames: 0, startedAt: 0})

  const stop = useCallback(() => {
    generation.current++
    if (timer.current) clearInterval(timer.current)
    timer.current = undefined
    capture.current?.stop()
    capture.current = undefined
    client.current?.dispose()
    client.current = undefined
    ring.current = undefined
    running.current = false
    recent.current = []
    setLive(OFF)
  }, [])

  // Nothing here survives the screen going away, and the microphone least of
  // all: a capture left open holds the device's microphone against every other
  // app on it.
  useEffect(() => stop, [stop])

  /*
   * Losing the foreground stops live mode outright, rather than listening on
   * in the background. That is a product decision — see the PRD — and also
   * what keeps the app clear of Android's foreground-service permissions.
   * `pagehide` is there for the cases `visibilitychange` does not fire in: a
   * swipe out of the browser, a WebView being torn down.
   */
  useEffect(() => {
    const hide = () => {
      if (document.visibilityState === 'hidden') stop()
    }
    document.addEventListener('visibilitychange', hide)
    addEventListener('pagehide', stop)
    return () => {
      document.removeEventListener('visibilitychange', hide)
      removeEventListener('pagehide', stop)
    }
  }, [stop])

  const start = useCallback(
    (source: LiveSource) => {
      if (capture.current) return
      const buffer = new Ring()
      ring.current = buffer
      recent.current = []
      totals.current = {runs: 0, sumMs: 0, maxMs: 0, skipped: 0, frames: 0, startedAt: performance.now()}
      setLive({status: 'starting', quiet: false})

      client.current = createAnalysisClient()
      const begin = source === 'mock' ? startMockCapture : startLiveCapture
      capture.current = begin({
        onChunk: (samples) => {
          buffer.push(samples)
          totals.current.frames += samples.length
        },
        onOpen: () => setLive((prev) => ({...prev, status: 'listening'})),
        onError: (err: InputError) => {
          stop()
          // "Recording failed" is the wrong sentence for a mode that records
          // nothing; the rest of the codes say what they mean in both.
          onError(err.code === 'record-failed' ? 'listen-failed' : err.code)
        },
      })

      const era = generation.current

      timer.current = setInterval(() => {
        const t = totals.current
        // Not full yet: the window would be part silence, and silence
        // prepended to an engine is a different sound from an engine.
        if (!buffer.full) return
        // A tick that arrives while the last analysis is still running is
        // dropped rather than queued. A queue would grow without bound on a
        // phone that cannot keep up, and every entry in it would be stale.
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
            source: {kind: 'mic', name: 'live'},
          })
          .then((result) => {
            // Stopped, or restarted, while this was in the worker.
            if (era !== generation.current) return
            running.current = false
            const ms = performance.now() - startedAt
            t.runs++
            t.sumMs += ms
            t.maxMs = Math.max(t.maxMs, ms)
            const elapsedS = (performance.now() - t.startedAt) / 1000
            const stats: LiveStats | undefined = FEATURES.mockLive
              ? {
                  runs: t.runs,
                  lastMs: ms,
                  avgMs: t.sumMs / t.runs,
                  maxMs: t.maxMs,
                  skipped: t.skipped,
                  captureRatio: elapsedS > 0 ? t.frames / SAMPLE_RATE / elapsedS : 0,
                }
              : undefined
            if (!result.ok) {
              // The engine stopping is not an error. It is a quiet window, and
              // what to do about it is the user's preference, not ours.
              setLive((prev) => ({...prev, status: 'listening', quiet: true, stats}))
              return
            }

            // Median, not a running average: when the method is wrong it is
            // wrong by a whole octave, and the mean of 1400 and 2800 is a
            // number the engine never turned at. A median ignores the outlier.
            const history = recent.current
            history.push(result.rpm)
            if (history.length > LIVE_SMOOTH_N) history.shift()
            setLive({status: 'listening', reading: median(history), quiet: false, stats})
          })
      }, LIVE_INTERVAL_MS)
    },
    [onError, stop],
  )

  return {live, ring, start, stop}
}
