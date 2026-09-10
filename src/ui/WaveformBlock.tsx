import type { AudioClip } from '../audio/types'
import { selectionLength, type Selection } from '../waveform/selection'
import { LONG_CLIP_S, detailRange } from '../waveform/range'
import { WaveformCanvas } from './WaveformCanvas'

const fmt = (s: number) => {
  const m = Math.floor(s / 60)
  const r = s - m * 60
  return `${m}:${r.toFixed(1).padStart(4, '0')}`
}

interface Props {
  clip: AudioClip
  selection: Selection
  onChange: (sel: Selection) => void
  positionS?: number
}

export function WaveformBlock({ clip, selection, onChange, positionS }: Props) {
  const long = clip.durationS > LONG_CLIP_S
  return (
    <div className="wave-block">
      {long && (
        <WaveformCanvas
          clip={clip}
          range={{ fromS: 0, toS: clip.durationS }}
          selection={selection}
          onChange={onChange}
          positionS={positionS}
          handles={false}
          height={48}
        />
      )}
      <WaveformCanvas
        clip={clip}
        range={long ? detailRange(selection, clip.durationS) : { fromS: 0, toS: clip.durationS }}
        selection={selection}
        onChange={onChange}
        positionS={positionS}
        handles
        height={140}
      />
      <p className="readout mono">
        {fmt(selection.startS)} - {fmt(selection.endS)} · {selectionLength(selection).toFixed(1)} s
      </p>
    </div>
  )
}
