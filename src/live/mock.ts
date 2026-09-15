/**
 * A microphone that is not one: an engine the app synthesises for itself.
 *
 * It exists twice over. Live mode is otherwise only testable next to a running
 * motorcycle, which is a poor place to hold a laptop — and the web build at
 * areg.nl is a demo, where a visitor with no engine in the room would otherwise
 * find the app's main feature to be a dial at zero and a permission prompt.
 *
 * It wears exactly the interface the real capture wears — same options, same
 * `LiveCapture` back — so the ring, the worker, the smoothing, the needle and
 * the scope are handed the same shape of data at the same rate and cannot tell
 * which one they got. What it is *not* is a microphone pointed at a speaker:
 * the signal never leaves the app, so the room's noise, the volume and whether
 * the phone is muted have no bearing on the reading.
 *
 * It looped a bundled recording until 2026-09-15. A synthesiser is better on
 * every count that matters here: it needs no audio in the build, it holds a
 * speed instead of replaying one, and that speed can be changed while it runs,
 * which is the difference between showing a tachometer and showing a picture of
 * one. The synthesis comes from `~/git/revbench`; see `engine-worklet.js`.
 *
 * What ships with it is decided by the build, not by an edit here:
 * `VITE_MOCK=1` for the website, nothing for a release.
 */
import {MIN_RATE} from '../dsp/autocorr'
import {MAX_RPM, REVS_PER_PULSE, type RevsPerPulse} from '../dsp/types'
import {InputError} from '../audio/types'
import type {MockHandle} from './mock-engine'
import type {LiveCapture, LiveOptions} from './stream'

export const MOCK_ENABLED = __MOCK__

/** What the engine is doing: the two things the worklet needs told. */
export interface MockEngine {
  rpm: number
  /** Followed from the rider's own stroke setting, so the dial reads the same on both. */
  revsPerPulse: RevsPerPulse
}

/**
 * Where the slider starts, every time. A speed a single-cylinder four-stroke
 * plausibly idles at, and inside the range every part of the app agrees on.
 */
export const MOCK_START_RPM = 1500

/** A drag resolution, not a precision claim. */
export const MOCK_STEP_RPM = 100

/**
 * The bottom of what the estimator searches — the same floor `ui/dial.ts` draws
 * from. Below it the app has nothing to say, so the slider does not go there.
 */
export const MOCK_MIN_RPM = MIN_RATE * 60 * REVS_PER_PULSE

/**
 * The top of what the synthesised engine and the analysis agree on.
 *
 * Measured rather than argued. revbench's own sweep renders this worklet at a
 * spread of speeds and reads each clip back through the scipy baseline; run on
 * 2026-09-15 against the search range *scaled to the engine rendered*, which is
 * what the app does and what revbench's `check.py` does not, both strokes read
 * back inside 1.1% at every speed from 600 to 12,000. So this is `MAX_RPM`, for
 * either engine, and the slider needs no second ceiling.
 *
 * It is worth knowing which direction it would give way in. On a two-stroke the
 * combustions arrive twice as fast — 200 a second at the top — and the
 * confidence falls with it, 1.18 at the floor to 0.63 at 12,000. Still well
 * clear of `MIN_CONFIDENCE`, but it is the number that would go first if the
 * envelope or the search were ever retuned. The evidence is in
 * `features/demo-mock/evidence/` in the workflow repo.
 */
export const MOCK_MAX_RPM = MAX_RPM

export interface MockBounds {
  min: number
  max: number
  step: number
}

/**
 * Three limits, and the tightest wins: what the estimator can read, what this
 * engine reads back truthfully, and what the rider's own dial can draw. The
 * last is why the face is an argument — a demo that drives the needle onto the
 * stop is showing a broken instrument, not a working one.
 *
 * The stroke is not an argument, though the sweep was run per stroke to find
 * out whether it had to be: a two-stroke fires twice as often at the same
 * speed, and the search is scaled by exactly that, so the two ends of the dial
 * are the two ends of the dial on either engine.
 */
export function mockRpmBounds(maxRpm: number): MockBounds {
  return {
    min: MOCK_MIN_RPM,
    max: Math.max(MOCK_MIN_RPM, Math.min(maxRpm, MOCK_MAX_RPM)),
    step: MOCK_STEP_RPM,
  }
}

/** Held to the face and the floor, and to whole steps of the slider. */
export function clampMockRpm(rpm: number, bounds: MockBounds): number {
  const stepped = Math.round(rpm / bounds.step) * bounds.step
  return Math.min(bounds.max, Math.max(bounds.min, stepped))
}

/**
 * Starts the engine, and hands back the handle before it is running.
 *
 * Synchronous, because that is the shape `useLive` starts a capture with — it
 * has to have something to stop before the audio graph exists. Everything that
 * can be awaited is awaited inside, and a stop or a tune that arrives during
 * those few hundred milliseconds is remembered rather than lost.
 *
 * The import is dynamic and inside `__MOCK__` on purpose: it is what keeps the
 * synthesiser, and the worklet asset it names, out of every build that is not a
 * demo. See `mock-engine.ts`.
 */
export function startMockCapture(options: LiveOptions, engine: MockEngine): LiveCapture {
  let stopped = false
  let open: MockHandle | undefined
  // The one place the engine's current state lives. The slider knows a speed
  // and the settings know a stroke; neither knows both, and neither has to.
  let wanted = engine

  void (async () => {
    if (!__MOCK__) return
    try {
      const {openMockEngine} = await import('./mock-engine')
      if (stopped) return
      open = await openMockEngine(options, wanted, () => !stopped)
      if (stopped) open.stop()
      else open.tune(wanted)
    } catch (e) {
      // A broken mock should look like a broken microphone rather than a crash:
      // it goes down the same path, and the screen says one sentence.
      options.onError(e instanceof InputError ? e : new InputError('listen-failed', e))
    }
  })()

  return {
    stop: () => {
      stopped = true
      open?.stop()
    },
    tune: (next) => {
      wanted = {...wanted, ...next}
      open?.tune(wanted)
    },
  }
}
