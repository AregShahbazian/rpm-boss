import {useI18n} from '../i18n'
import {Icon} from './Icon'
import {Button} from './kit'

interface Props {
  recording: boolean
  disabled?: boolean
  onStart: () => void
  onStop: () => void
}

export function RecordButton({recording, disabled, onStart, onStop}: Props) {
  const {t} = useI18n()
  // The counter moved to the status line under the button: a label and a
  // running figure made this the one button on the row that changed width
  // while it was being looked at.
  if (recording) {
    return (
      <Button shape="icon" tone="record" aria-label={t('stopRecording')} onClick={onStop}>
        <Icon icon="mdi:stop"/>
      </Button>
    )
  }
  return (
    <Button shape="icon" aria-label={t('record')} disabled={disabled} onClick={onStart}>
      {/* `flex`, so the svg is not an inline box sitting on the span's
          baseline — that is what lifted the dot above the button's centre. */}
      <span className="flex text-error">
        <Icon icon="mdi:record"/>
      </span>
    </Button>
  )
}
