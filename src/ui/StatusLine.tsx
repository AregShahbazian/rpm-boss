import type {AudioInputState} from '../state/useAudioInput'
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

  switch (state.status) {
    case 'idle':
      return <StatusText tone="muted">{t('statusIdle')}</StatusText>
    case 'decoding':
      return <StatusText>{t('statusDecoding')}</StatusText>
    case 'recording':
      return <StatusText>{t('statusRecording')}</StatusText>
    case 'error':
      return (
        <StatusText tone="error" role="alert">
          {state.error
            ? t(INPUT_ERROR_KEYS[state.error], {duration: duration(MIN_CLIP_S, lang)})
            : t('errorRecordFailed')}{' '}
          <LinkButton onClick={onDismiss}>
            {t('dismiss')}
          </LinkButton>
        </StatusText>
      )
    case 'loaded':
      return (
        <StatusText>
          {t('statusLoaded', {
            name: state.clip?.source.name ?? '',
            duration: duration(Number((state.clip?.durationS ?? 0).toFixed(1)), lang),
          })}
        </StatusText>
      )
  }
}
