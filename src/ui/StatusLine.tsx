import type { AudioInputState } from '../state/useAudioInput'
import { duration, useI18n } from '../i18n'
import { INPUT_ERROR_KEYS } from './errorKeys'
import { MIN_CLIP_S } from '../audio/types'

interface Props {
  state: AudioInputState
  onDismiss: () => void
}

export function StatusLine({ state, onDismiss }: Props) {
  const { t, lang } = useI18n()

  switch (state.status) {
    case 'idle':
      return <p className="status muted">{t('statusIdle')}</p>
    case 'decoding':
      return <p className="status">{t('statusDecoding')}</p>
    case 'recording':
      return <p className="status">{t('statusRecording')}</p>
    case 'error':
      return (
        <p className="status error" role="alert">
          {state.error
            ? t(INPUT_ERROR_KEYS[state.error], { duration: duration(MIN_CLIP_S, lang) })
            : t('errorRecordFailed')}
          {import.meta.env.DEV && state.errorDetail ? ` [dev: ${state.errorDetail}]` : ''}{' '}
          <button type="button" className="link" onClick={onDismiss}>
            {t('dismiss')}
          </button>
        </p>
      )
    case 'loaded':
      return (
        <p className="status">
          {t('statusLoaded', {
            name: state.clip?.source.name ?? '',
            duration: duration(Number((state.clip?.durationS ?? 0).toFixed(1)), lang),
          })}
        </p>
      )
  }
}
