import { useRef, useState } from 'react'
import type { AudioClip } from '../audio/types'
import { detailSpanS, nextDetailRange, type TimeRange } from '../waveform/range'
import { selectionLength, type Selection } from '../waveform/selection'
import { formatTime } from './format'
import { useElementSize } from './useElementSize'
import { WaveformCanvas } from './WaveformCanvas'

/** A finished analysis, drawn onto the crop canvas. */
export interface Marks {
  timesS: readonly number[]
  /** Where the analysed window starts in the clip. */
  offsetS: number
  /** How long it is. */
  windowS: number
}

interface Props {
  clip: AudioClip
  selection: Selection
  onChange: (sel: Selection) => void
  positionS?: number
  marks?: Marks
}

/**
 * The crop, and — once there is a result — the combustions found in it.
 *
 * There is one waveform here, not two. A result used to bring its own canvas,
 * because a ten second window inside a thirty second detail view puts its marks
 * less than a pixel apart. Instead the detail view snaps to the analysed window
 * when the result arrives, which makes the marks land at the spacing they were
 * found at, and releases the snap the moment the user touches the waveform
 * again — before the drag moves anything, so the view widens once rather than
 * sliding out from under the finger.
 */
export function WaveformBlock({ clip, selection, onChange, positionS, marks }: Props) {
  const overviewBox = useRef<HTMLDivElement>(null)
  const detailBox = useRef<HTMLDivElement>(null)
  const overview = useElementSize(overviewBox)
  const detail = useElementSize(detailBox)

  const spanS = detailSpanS(detail.width)
  const long = clip.durationS > spanS
  const whole: TimeRange = { fromS: 0, toS: clip.durationS }

  // The detail range is derived from the selection, but remembers where it was:
  // it scrolls only when the window is dragged out of view. `nextDetailRange`
  // returns the previous range unchanged otherwise, so React bails out and the
  // waveform is not redrawn. Adjusting state during render (rather than in an
  // effect) keeps it to a single commit.
  const [range, setRange] = useState<TimeRange>(() => nextDetailRange(undefined, selection, clip.durationS, spanS))
  const [snapped, setSnapped] = useState(false)
  const [seen, setSeen] = useState({ selection, spanS, marks })

  if (seen.selection !== selection || seen.spanS !== spanS || seen.marks !== marks) {
    setSeen({ selection, spanS, marks })
    if (marks && marks !== seen.marks) {
      setSnapped(true)
      setRange({ fromS: marks.offsetS, toS: marks.offsetS + marks.windowS })
    } else if (!marks && seen.marks) {
      setSnapped(false)
      setRange(nextDetailRange(undefined, selection, clip.durationS, spanS))
    } else if (!snapped) {
      setRange((prev) => nextDetailRange(prev, selection, clip.durationS, spanS))
    }
  }

  /** The way back out of the zoomed view: touching the waveform at all. */
  const releaseSnap = () => {
    if (!snapped) return
    setSnapped(false)
    setRange(nextDetailRange(undefined, selection, clip.durationS, spanS))
  }

  return (
    <div className="wave-block" onPointerDownCapture={releaseSnap}>
      {long && (
        <div className="wave wave-overview" ref={overviewBox}>
          <WaveformCanvas
            clip={clip}
            range={whole}
            selection={selection}
            onChange={onChange}
            positionS={positionS}
            handles={false}
            width={overview.width}
            height={overview.height}
          />
        </div>
      )}
      <div className="wave wave-detail" ref={detailBox}>
        <WaveformCanvas
          clip={clip}
          range={long ? range : whole}
          selection={selection}
          onChange={onChange}
          positionS={positionS}
          handles
          width={detail.width}
          height={detail.height}
          marks={marks}
        />
      </div>
      <p className="readout mono" dir="ltr">
        {formatTime(selection.startS, 1)} - {formatTime(selection.endS, 1)} · {selectionLength(selection).toFixed(1)} s
      </p>
    </div>
  )
}
