import type {AudioInputState, InputStatus} from '../state/useAudioInput'
import {duration, useI18n} from '../i18n'
import {INPUT_ERROR_KEYS} from './errorKeys'
import {MIN_CLIP_S} from '../audio/types'
import {LinkButton, StatusText} from './kit'

interface Props {
  state: AudioInputState
  onDismiss: () => void
}

export function StatusLine({state, onDismiss}: Props) {
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
        return <StatusText tone="muted">{t('statusIdle')}</StatusText>
      case 'decoding':
        return <StatusText>{t('statusDecoding')}</StatusText>
      case 'recording':
        return <StatusText>{t('statusRecording')}</StatusText>
      case 'loaded': {
        // A file says its own name; a recording's name is a timestamp the app
        // invented, and repeating it back says nothing the user did not just
        // watch happen.
        const length = duration(Number((state.clip?.durationS ?? 0).toFixed(1)), lang)
        return (
          <StatusText>
            {state.clip?.source.kind === 'mic'
              ? t('statusRecorded', {duration: length})
              : `${state.clip?.source.name ?? ''} - ${length}`}
          </StatusText>
        )
      }
    }
  }

  return (
    <>
      {state.status === 'error' && (
        <StatusText tone="error" role="alert">
          {state.error
            ? t(INPUT_ERROR_KEYS[state.error], {duration: duration(MIN_CLIP_S, lang)})
            : t('errorRecordFailed')}{' '}
          <LinkButton onClick={onDismiss}>
            {t('dismiss')}
          </LinkButton>
        </StatusText>
      )}
      {settledLine()}
    </>
  )
}
