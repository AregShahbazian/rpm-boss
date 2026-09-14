import {MAX_RECORD_S} from '../audio/types'
import {useI18n} from '../i18n'
import {Icon} from './Icon'
import {Button} from './kit'

interface Props {
  recording: boolean
  elapsedS: number
  disabled?: boolean
  onStart: () => void
  onStop: () => void
}

export function RecordButton({recording, elapsedS, disabled, onStart, onStop}: Props) {
  const {t} = useI18n()
  if (recording) {
    return (
      <Button tone="record" onClick={onStop}>
        <Icon icon="mdi:stop"/> {t('stopRecording')}{' '}
        <span className="tabular-nums">
          {elapsedS.toFixed(1)} / {MAX_RECORD_S} s
        </span>
      </Button>
    )
  }
  return (
    <Button disabled={disabled} onClick={onStart}>
      <span className="text-error">
          <Icon icon="mdi:record"/>
        </span> {t('record')}
    </Button>
  )
}
