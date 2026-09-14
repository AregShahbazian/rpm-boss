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
import {FEATURES} from '../features'
import {useI18n} from '../i18n'
import type {Ring} from '../live/ring'
import {SAMPLES_ENABLED} from '../samples'
import type {LiveSource, LiveState} from '../state/useLive'
import {LiveStats} from './LiveStats'
import {Icon} from './Icon'
import {Button} from './kit'
import type {Motion} from './liveSettings'
import {LiveScope} from './LiveScope'
import {Tacho} from './Tacho'

interface Props {
  live: LiveState
  ring: React.RefObject<Ring | undefined>
  /** What the dial should point at, or undefined for nothing; see `displayRpm`. */
  rpm?: number
  motion: Motion
  onStart: (source: LiveSource) => void
}

/** Three dashes rather than a zero: the app is not claiming the engine is stopped. */
const NOTHING = '---'

/** The mock is a developer's affordance, and dead in a build with no samples to play. */
const MOCK_AVAILABLE = FEATURES.mockLive && SAMPLES_ENABLED

export function LiveStage({live, ring, rpm, motion, onStart}: Props) {
  const {t} = useI18n()
  const listening = live.status !== 'off'

  return (
    <div className="grid size-full grid-rows-[4fr_1fr] gap-[var(--gap)]">
      <div className="grid min-h-0 grid-rows-[4fr_1fr]">
        <div className="min-h-0">
          <Tacho rpm={rpm} motion={motion}/>
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
            {MOCK_AVAILABLE && (
              // Untranslated on purpose: a debug button is no reason to put a
              // word in front of sixteen translators.
              <Button shape="fill" onClick={() => onStart('mock')}>
                <Icon icon="mdi:flask-outline"/> Mock
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
