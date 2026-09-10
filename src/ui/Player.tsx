import { formatTime } from './format'

interface Props {
  playing: boolean
  positionS: number
  durationS: number
  onToggle: () => void
}

export function Player({ playing, positionS, durationS, onToggle }: Props) {
  return (
    <div className="player">
      <button type="button" className="btn" onClick={onToggle}>
        {playing ? '■ Stop' : '▶ Play'}
      </button>
      <span className="mono">
        {formatTime(positionS)} / {formatTime(durationS)}
      </span>
    </div>
  )
}
