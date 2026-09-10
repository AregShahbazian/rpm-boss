/** Where a combustion mark goes on the crop waveform. */

/**
 * Ticks for a result drawn against a visible time range, rather than against
 * the analysed window alone.
 *
 * The marks now land on the crop canvas, which shows a range of the whole clip.
 * Pulse times are relative to the analysed window, so they are offset by the
 * window start before being mapped. Anything outside the visible range is
 * dropped rather than clamped: a mark pinned to the edge would read as a
 * combustion that happened there.
 */
export function tickPositionsInRange(
  timesS: readonly number[],
  offsetS: number,
  range: { fromS: number; toS: number },
  width: number,
): number[] {
  const spanS = range.toS - range.fromS
  if (!(spanS > 0) || !(width > 0)) return []
  const out: number[] = []
  let last = -1
  for (const t of timesS) {
    const at = offsetS + t
    if (at < range.fromS || at > range.toS) continue
    const x = Math.round(((at - range.fromS) / spanS) * width)
    if (x !== last) out.push(x)
    last = x
  }
  return out
}
