import type { Selection } from './selection'

export interface TimeRange {
  fromS: number
  toS: number
}

/** Above this the UI shows an overview strip plus a detail view. */
export const LONG_CLIP_S = 30
export const DETAIL_SPAN_S = 30

const spanFrom = (fromS: number, durationS: number): TimeRange => {
  const clamped = Math.max(0, Math.min(fromS, durationS - DETAIL_SPAN_S))
  return { fromS: clamped, toS: clamped + DETAIL_SPAN_S }
}

/**
 * The visible detail range for a selection.
 *
 * `prev` is kept whenever the selection still fits inside it, so the waveform
 * stands still while a window is dragged; only a window pushed past an edge
 * scrolls the view, and then by the smallest amount that brings it back in.
 * Re-centring on every change would make the view chase the finger and double
 * the apparent drag speed.
 */
export function nextDetailRange(prev: TimeRange | undefined, sel: Selection, durationS: number): TimeRange {
  if (durationS <= DETAIL_SPAN_S) return { fromS: 0, toS: durationS }
  if (!prev) return spanFrom((sel.startS + sel.endS) / 2 - DETAIL_SPAN_S / 2, durationS)
  if (sel.startS >= prev.fromS && sel.endS <= prev.toS) return prev
  if (sel.startS < prev.fromS) return spanFrom(sel.startS, durationS)
  return spanFrom(sel.endS - DETAIL_SPAN_S, durationS)
}
