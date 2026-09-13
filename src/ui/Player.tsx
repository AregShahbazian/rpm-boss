import { useI18n } from '../i18n'
import { formatTime } from './format'
import { Button } from './kit'

interface Props {
  playing: boolean
  positionS: number
  durationS: number
  onToggle: () => void
}

export function Player({ playing, positionS, durationS, onToggle }: Props) {
  const { t } = useI18n()
  return (
    <div className="player">
      <Button shape="fit" onClick={onToggle}>
        {playing ? `■ ${t('stopPlaying')}` : `▶ ${t('play')}`}
      </Button>
      <span className="mono">
        {formatTime(positionS)} / {formatTime(durationS)}
      </span>
    </div>
  )
}
