import { MAX_RECORD_S } from '../audio/types'

interface Props {
  recording: boolean
  elapsedS: number
  disabled?: boolean
  onStart: () => void
  onStop: () => void
}

export function RecordButton({ recording, elapsedS, disabled, onStart, onStop }: Props) {
  if (recording) {
    return (
      <button type="button" className="btn btn-rec" onClick={onStop}>
        <span aria-hidden>■</span> Stop <span className="mono">{elapsedS.toFixed(1)} / {MAX_RECORD_S} s</span>
      </button>
    )
  }
  return (
    <button type="button" className="btn" disabled={disabled} onClick={onStart}>
      <span className="dot" aria-hidden>●</span> Record
    </button>
  )
}
