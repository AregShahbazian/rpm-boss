/**
 * The space the live tachometer and the live waveform will fill.
 *
 * Empty on purpose. The feature is not built, but the room it needs is a
 * layout decision that can be made now: it is everything under the source row
 * when nothing is loaded, which is what decides that the row sits at the top
 * of a landscape screen instead of in the middle of it. The outlines are
 * temporary and exist only so the divisions are visible while every part is
 * still empty — they go when something real is drawn in them.
 *
 * Three parts. The gauge is the thing being read at arm's length; the figure
 * under it is the same reading in words, the way the result line states it
 * after a calculation; and the waveform at the foot is a strip that says the
 * microphone is hearing an engine, not something to be read.
 */
const BOX = 'rounded-[10px] border-2 border-dashed border-muted/40'

export function LiveStage() {
  return (
    <div aria-hidden className="grid size-full grid-rows-[4fr_1fr] gap-[var(--gap)]">
      <div className={`grid grid-rows-[4fr_1fr] ${BOX}`}>
        <div/>
        {/* One line, not a second outline: the figure belongs to the gauge and
            is divided from it, not boxed off from it.
            The style goes on the top edge alone. `border-dashed` would set it
            on all four, and without Preflight the other three would then draw
            themselves at the initial `medium` width — a box, not a line. */}
        <div className="border-t-2 [border-top-style:dashed] border-muted/40"/>
      </div>
      <div className={BOX}/>
    </div>
  )
}
