import type { Selection } from './selection'

export interface TimeRange {
  fromS: number
  toS: number
}

/** Above this the UI shows an overview strip plus a detail view. */
export const LONG_CLIP_S = 30
export const DETAIL_SPAN_S = 30

/** A DETAIL_SPAN_S window centred on the selection, clamped to the clip. */
export function detailRange(sel: Selection, durationS: number): TimeRange {
  if (durationS <= DETAIL_SPAN_S) return { fromS: 0, toS: durationS }
  const mid = (sel.startS + sel.endS) / 2
  const fromS = Math.max(0, Math.min(mid - DETAIL_SPAN_S / 2, durationS - DETAIL_SPAN_S))
  return { fromS, toS: fromS + DETAIL_SPAN_S }
}
