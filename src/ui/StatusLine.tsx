import type { AudioInputState } from '../state/useAudioInput'
import { duration, useI18n } from '../i18n'
import { INPUT_ERROR_KEYS } from './errorKeys'
import { MIN_CLIP_S } from '../audio/types'
import { LinkButton } from './kit'

interface Props {
  state: AudioInputState
  onDismiss: () => void
}

/**
 * One line, and in the split layout the rest is elided: a landscape phone
 * cannot spare the second line a long file name takes, and the name is the
 * least of what the line says. Errors are exempt — they are longer, they
 * matter more, and Dismiss sits at the end of them.
 */
const LINE = 'm-0 min-h-[1.5em] split:truncate'

export function StatusLine({ state, onDismiss }: Props) {
  const { t, lang } = useI18n()

  switch (state.status) {
    case 'idle':
      return <p className={`${LINE} text-muted`}>{t('statusIdle')}</p>
    case 'decoding':
      return <p className={LINE}>{t('statusDecoding')}</p>
    case 'recording':
      return <p className={LINE}>{t('statusRecording')}</p>
    case 'error':
      return (
        <p className="m-0 min-h-[1.5em] text-error" role="alert">
          {state.error
            ? t(INPUT_ERROR_KEYS[state.error], { duration: duration(MIN_CLIP_S, lang) })
            : t('errorRecordFailed')}
          {import.meta.env.DEV && state.errorDetail ? ` [dev: ${state.errorDetail}]` : ''}{' '}
          <LinkButton onClick={onDismiss}>
            {t('dismiss')}
          </LinkButton>
        </p>
      )
    case 'loaded':
      return (
        <p className={LINE}>
          {t('statusLoaded', {
            name: state.clip?.source.name ?? '',
            duration: duration(Number((state.clip?.durationS ?? 0).toFixed(1)), lang),
          })}
        </p>
      )
  }
}
