import type {AudioInputState, InputStatus} from '../state/useAudioInput'
import {duration, useI18n} from '../i18n'
import {INPUT_ERROR_KEYS} from './errorKeys'
import {type AudioClip, MAX_RECORD_S, MIN_CLIP_S} from '../audio/types'
import {LinkButton, StatusText} from './kit'

interface Props {
  state: AudioInputState
  onDismiss: () => void
  onClear: () => void
  onSave: () => void
}

export function StatusLine({state, onDismiss, onClear, onSave}: Props) {
  const {t, lang} = useI18n()

  /**
   * What the screen would be saying if nothing had gone wrong.
   *
   * An error is not a state the app is in so much as a thing that happened to
   * it: a refused microphone leaves the file that was already open exactly
   * where it was. So the error gets a line of its own above this one instead
   * of taking its place — otherwise a failed recording attempt would leave a
   * loaded waveform on screen with nothing describing it.
   *
   * `dismissError` resolves the status the same way when the error is cleared,
   * which is what makes the line below the error the line that stays.
   */
  const settled: Exclude<InputStatus, 'error'> =
    state.status === 'error' ? (state.clip ? 'loaded' : 'idle') : state.status

  const settledLine = () => {
    switch (settled) {
      case 'idle':
        return null
      case 'decoding':
        return <StatusText>{t('statusDecoding')}</StatusText>
      case 'recording':
        return (
          <StatusText>
            {t('statusRecording')} -{' '}
            {/* Red, and the same red as the stop button above it: the two are
                one thing, and the counter is the only part that moves. */}
            <span className="tabular-nums text-error">
              {state.elapsedS.toFixed(1)} / {MAX_RECORD_S} s
            </span>
          </StatusText>
        )
      case 'loaded':
        return state.clip ? <LoadedLine clip={state.clip} onClear={onClear} onSave={onSave}/> : null
    }
  }

  return (
    <>
      {state.status === 'error' && (
        // The gap belongs to the error, not to the pair: it exists only while
        // the error does, so the status line does not shift down a little and
        // stay there once Dismiss has been pressed.
        <div className="mb-2">
          <StatusText tone="error" role="alert">
            {state.error
              ? t(INPUT_ERROR_KEYS[state.error], {duration: duration(MIN_CLIP_S, lang)})
              : t('errorRecordFailed')}{' '}
            <LinkButton onClick={onDismiss}>
              {t('dismiss')}
            </LinkButton>
          </StatusText>
        </div>
      )}
      {settledLine()}
    </>
  )
}

/**
 * What is loaded, and what can be done with it, on one line.
 *
 * The actions are link-styled rather than buttons, and for the same reason
 * Dismiss is: they sit inside a line of prose, and a third and fourth filled
 * button on this screen would compete with Record and Calculate for an eye
 * that should be going to those. They are pushed to the end of the line so the
 * name keeps the left edge and can truncate into the space they leave.
 *
 * Only a recording can be downloaded. A file that came off the device is
 * already on the device, and offering to give it back would be offering a
 * worse copy of it: what the app holds is 16 kHz mono, not what was opened.
 */
function LoadedLine({clip, onClear, onSave}: {clip: AudioClip; onClear: () => void; onSave: () => void}) {
  const {t, lang} = useI18n()
  // A file says its own name; a recording's name is a timestamp the app
  // invented, and repeating it back says nothing the user did not just watch
  // happen.
  const recorded = clip.source.kind === 'mic'
  const length = duration(Number(clip.durationS.toFixed(1)), lang)
  return (
    // Wraps: the column is only as wide as the source row, and a long file
    // name with two actions after it does not fit on one line of that. The
    // actions go to a second line together rather than the name truncating to
    // nothing.
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <div className="min-w-0 flex-auto">
        <StatusText>{recorded ? t('statusRecorded', {duration: length}) : `${clip.source.name} - ${length}`}</StatusText>
      </div>
      <div className="flex shrink-0 gap-3 ms-auto">
        {recorded && <LinkButton onClick={onSave}>{t('download')}</LinkButton>}
        <LinkButton onClick={onClear}>{t('cancel')}</LinkButton>
      </div>
    </div>
  )
}
