import {useI18n} from '../i18n'
import {formatTime} from './format'
import {Icon} from './Icon'
import {Button} from './kit'

interface Props {
  playing: boolean
  positionS: number
  durationS: number
  onToggle: () => void
}

export function Player({playing, positionS, durationS, onToggle}: Props) {
  const {t} = useI18n()
  return (
    <div className="flex items-center gap-3">
      <Button shape="fit" onClick={onToggle}>
        {playing ? (
          <>
            <Icon icon="mdi:stop"/>
            {t('stopPlaying')}
          </>
        ) : (
          <>
            <Icon icon="mdi:play"/>
            {t('play')}
          </>
        )}
      </Button>
      <span className="flex-auto tabular-nums">
        {formatTime(positionS)} / {formatTime(durationS)}
      </span>
    </div>
  )
}
