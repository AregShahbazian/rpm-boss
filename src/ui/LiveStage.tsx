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
import {Icon} from './Icon'
import {Button} from './kit'
import type {Motion} from './liveSettings'
import {LiveScope} from './LiveScope'
import {Tacho} from './Tacho'

interface Props {
  live: LiveState
  ring: React.RefObject<Ring | undefined>
  /** Already resolved against the user's fallback preference; see `displayRpm`. */
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
        {/* One line, not a second box: the figure belongs to the dial and is
            divided from it, not set apart from it. `border-0` first, because
            `border-solid` sets the style on all four edges and without
            Preflight the other three would then draw themselves at the
            initial `medium` width — a box, not a line. */}
        <div className="flex items-center justify-center border-0 border-t border-solid border-muted/40">
          <p
            className="m-0 flex items-baseline gap-2 tabular-nums text-[clamp(1.5rem,8vmin,3rem)]/[1.1]"
            data-testid="live-reading"
            dir="ltr"
          >
            <span>{rpm === undefined ? NOTHING : Math.round(rpm)}</span>
            <span className="text-[0.8rem] text-muted">{t('rpm')}</span>
          </p>
        </div>
      </div>
      <div className="min-h-0">
        {listening ? (
          <LiveScope ring={ring}/>
        ) : (
          <div className="flex size-full gap-[var(--gap)]">
            <Button shape="fill" onClick={() => onStart('mic')}>
              <Icon icon="mdi:ear-hearing"/> {t('listen')}
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
