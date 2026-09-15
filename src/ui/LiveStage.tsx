/**
 * The resting screen, and the live one: they are the same screen.
 *
 * The dial and its reading are always drawn — at zero and a row of dashes when
 * there is nothing to say — so starting live mode changes what the needle
 * does, not what the screen is made of. The strip at the foot is the only part
 * that swaps: the way in before, the signal itself after.
 *
 * Both halves fill what they are given. The stage's own proportions, set in
 * `InputScreen`, are the only thing deciding how big either of them is.
 */
import clsx from 'clsx'
import {useState} from 'react'
import {useI18n} from '../i18n'
import {clampMockRpm, MOCK_ENABLED, MOCK_START_RPM, mockRpmBounds} from '../live/mock'
import type {Ring} from '../live/ring'
import type {LiveSource, LiveState} from '../state/useLive'
import {LiveStats} from './LiveStats'
import {Icon} from './Icon'
import {Button, Slider} from './kit'
import type {Motion} from './liveSettings'
import {LiveScope} from './LiveScope'
import {Tacho} from './Tacho'

interface Props {
  live: LiveState
  ring: React.RefObject<Ring | undefined>
  /** What the dial should point at, or undefined for nothing; see `displayRpm`. */
  rpm?: number
  motion: Motion
  /** The face the dial is drawn on; the rider's, see `liveSettings`. */
  maxRpm: number
  redlineRpm: number
  onStart: (source: LiveSource, rpm?: number) => void
  /** How fast the simulated engine should turn. Ignored by a microphone. */
  onTune: (rpm: number) => void
}

/** Three dashes rather than a zero: the app is not claiming the engine is stopped. */
const NOTHING = '---'

export function LiveStage({live, ring, rpm, motion, maxRpm, redlineRpm, onStart, onTune}: Props) {
  const {t} = useI18n()
  const listening = live.status !== 'off'
  /*
   * Whether what is on the dial came out of a synthesiser. It is the only thing
   * the badge and the slider are allowed to key off: a reading from a real
   * engine is never marked, and never gets a throttle.
   *
   * `MOCK_ENABLED` is redundant to the running app — without it nothing can set
   * the source to `mock` — and load-bearing to the bundler, which cannot know
   * that. With the constant false this is false at compile time, and the badge,
   * the slider and the extra grid row go with it.
   */
  const simulated = MOCK_ENABLED && live.source === 'mock'
  const bounds = mockRpmBounds(maxRpm)
  /*
   * Clamped, not assumed. 1500 is inside every face the settings currently
   * allow — the dial cannot be set below 9,000 — but that is a fact about
   * another file's constant, and this one would fail silently and oddly if it
   * changed: the thumb pinned at the end of the track, the figure beside it
   * still reading 1500, and the engine actually turning at 1500 behind a
   * needle that says otherwise. The clamp costs a function call and removes
   * the coupling.
   */
  const [mockRpm, setMockRpm] = useState(() => clampMockRpm(MOCK_START_RPM, bounds))

  // Not remembered between runs: every start of the simulated engine begins at
  // the same idle, so the demo is the same demo for the next visitor. Reset
  // where the run begins rather than in an effect watching for it to end —
  // there is exactly one way in, and it is a button.
  const startMock = () => {
    const rpm = clampMockRpm(MOCK_START_RPM, bounds)
    setMockRpm(rpm)
    onStart('mock', rpm)
  }

  return (
    <div
      className={clsx(
        'grid size-full gap-[var(--gap)]',
        // An extra row, and only while there is something in it. The dial keeps
        // its share of what is left; the slider is the height of one control.
        simulated ? 'grid-rows-[4fr_1fr_auto]' : 'grid-rows-[4fr_1fr]',
      )}
    >
      <div className="grid min-h-0 grid-rows-[4fr_1fr]">
        <div className="relative min-h-0">
          <Tacho rpm={rpm} motion={motion} maxRpm={maxRpm} redlineRpm={redlineRpm}/>
          {/* Over the dial, not under it. A screenshot of the needle has to
              carry the caveat, or the caveat has failed at the one job it has. */}
          {simulated && (
            <p
              className="pointer-events-none absolute inset-x-0 top-0 m-0 text-center text-[0.7rem]/[1.4] text-muted"
              data-testid="simulated"
            >
              {t('simulated')}
            </p>
          )}
        </div>
        {/* No rule between the dial and its figure. The gap says it, and a
            line across a screen this sparse reads as a box that lost three
            of its sides. */}
        <div className="flex items-center justify-center">
          {/* The unit under the figure, not beside it. Beside it, the two
              compete for the same line in a strip that is a fifth of the
              stage; under it, the figure gets the whole width and the unit
              stays a caption. */}
          <p
            className="m-0 flex flex-col items-center tabular-nums text-[clamp(1.5rem,8vmin,3rem)]/[1.1]"
            data-testid="live-reading"
            dir="ltr"
          >
            <span>{rpm === undefined ? NOTHING : Math.round(rpm)}</span>
            <span className="text-[0.8rem]/[1.4] text-muted">{t('rpm')}</span>
          </p>
        </div>
      </div>
      <div className="relative min-h-0">
        {live.stats && <LiveStats stats={live.stats}/>}
        {listening ? (
          <LiveScope ring={ring}/>
        ) : (
          <div className="flex size-full gap-[var(--gap)]">
            {/* No icon and a word twice the usual size: it is the only thing
                to do on a screen that is otherwise a gauge at zero, and it
                should read as such from arm's length. */}
            <Button shape="fill" tone="go" onClick={() => onStart('mic')}>
              <span className="text-[clamp(1.25rem,6vmin,2rem)]/[1.2]">{t('listen')}</span>
            </Button>
            {/* The real thing stays the primary action, on the demo build too:
                this one is the same size in a plainer tone, and says in a word
                that the engine behind it is not real. */}
            {MOCK_ENABLED && (
              <Button shape="fill" onClick={startMock}>
                <Icon icon="mdi:flask-outline"/> {t('mockEngine')}
              </Button>
            )}
          </div>
        )}
      </div>
      {/* The throttle. A tachometer at one speed is a picture of a tachometer;
          this is what makes the demo show the needle doing its job. */}
      {simulated && (
        <Slider
          label={t('mockSpeed')}
          value={mockRpm}
          min={bounds.min}
          max={bounds.max}
          step={bounds.step}
          onChange={(next) => {
            setMockRpm(next)
            onTune(next)
          }}
        />
      )}
    </div>
  )
}
