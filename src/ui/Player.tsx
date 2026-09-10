interface Props {
  playing: boolean
  positionS: number
  durationS: number
  onToggle: () => void
}

const mmss = (s: number) => {
  const m = Math.floor(s / 60)
  const r = Math.floor(s - m * 60)
  return `${m}:${String(r).padStart(2, '0')}`
}

export function Player({ playing, positionS, durationS, onToggle }: Props) {
  return (
    <div className="player">
      <button type="button" className="btn" onClick={onToggle}>
        {playing ? '■ Stop' : '▶ Play'}
      </button>
      <span className="mono">
        {mmss(positionS)} / {mmss(durationS)}
      </span>
    </div>
  )
}
