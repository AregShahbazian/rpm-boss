/** Where a combustion mark goes on the result waveform. */

/**
 * Pixel x for a pulse at `timeS` seconds into a window `windowS` long, drawn
 * `width` pixels wide. Clamped, because a pulse found in the last render
 * quantum can round a hair past the end.
 */
export function tickX(timeS: number, windowS: number, width: number): number {
  if (!(windowS > 0) || !(width > 0)) return 0
  const x = (timeS / windowS) * width
  return Math.min(width, Math.max(0, x))
}

/** Ticks for a whole result, in order, deduplicated to whole pixels. */
export function tickPositions(timesS: readonly number[], windowS: number, width: number): number[] {
  const out: number[] = []
  let last = -1
  for (const t of timesS) {
    const x = Math.round(tickX(t, windowS, width))
    if (x !== last) out.push(x)
    last = x
  }
  return out
}
