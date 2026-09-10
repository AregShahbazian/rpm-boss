import { MAX_RECORD_S } from '../audio/types'
import { useI18n } from '../i18n'

interface Props {
  recording: boolean
  elapsedS: number
  disabled?: boolean
  onStart: () => void
  onStop: () => void
}

export function RecordButton({ recording, elapsedS, disabled, onStart, onStop }: Props) {
  const { t } = useI18n()
  if (recording) {
    return (
      <button type="button" className="btn btn-rec" onClick={onStop}>
        <span aria-hidden>■</span>{' '}
        <span className="mono">{t('stopRecording', { elapsed: elapsedS.toFixed(1), max: MAX_RECORD_S })}</span>
      </button>
    )
  }
  return (
    <button type="button" className="btn" disabled={disabled} onClick={onStart}>
      <span className="dot" aria-hidden>●</span> {t('record')}
    </button>
  )
}
