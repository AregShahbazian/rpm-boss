import { useI18n } from '../i18n'
import { formatTime } from './format'

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
      <button type="button" className="btn" onClick={onToggle}>
        {playing ? `■ ${t('stopPlaying')}` : `▶ ${t('play')}`}
      </button>
      <span className="mono">
        {formatTime(positionS)} / {formatTime(durationS)}
      </span>
    </div>
  )
}
