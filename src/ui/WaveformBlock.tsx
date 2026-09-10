import { useState } from 'react'
import type { AudioClip } from '../audio/types'
import { LONG_CLIP_S, nextDetailRange, type TimeRange } from '../waveform/range'
import { selectionLength, type Selection } from '../waveform/selection'
import { formatTime } from './format'
import { WaveformCanvas } from './WaveformCanvas'

interface Props {
  clip: AudioClip
  selection: Selection
  onChange: (sel: Selection) => void
  positionS?: number
}

export function WaveformBlock({ clip, selection, onChange, positionS }: Props) {
  const long = clip.durationS > LONG_CLIP_S
  // The detail range is derived from the selection, but remembers where it was:
  // it scrolls only when the window is dragged out of view. `nextDetailRange`
  // returns the previous range unchanged otherwise, so React bails out and the
  // waveform is not redrawn. Adjusting state during render (rather than in an
  // effect) keeps it to a single commit.
  const [detail, setDetail] = useState<TimeRange>(() => nextDetailRange(undefined, selection, clip.durationS))
  const [seen, setSeen] = useState<Selection>(selection)
  if (seen !== selection) {
    setSeen(selection)
    setDetail((prev) => nextDetailRange(prev, selection, clip.durationS))
  }
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
        range={long ? detail : { fromS: 0, toS: clip.durationS }}
        selection={selection}
        onChange={onChange}
        positionS={positionS}
        handles
        height={140}
      />
      <p className="readout mono">
        {formatTime(selection.startS, 1)} - {formatTime(selection.endS, 1)} · {selectionLength(selection).toFixed(1)} s
      </p>
    </div>
  )
}
