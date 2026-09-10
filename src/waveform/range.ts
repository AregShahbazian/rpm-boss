import { MAX_WINDOW_S, type Selection } from './selection'

export interface TimeRange {
  fromS: number
  toS: number
}

/**
 * The legibility floor for the detail view, in pixels per second.
 *
 * This used to be a pair of constants — show the overview above 30 s, span 30 s
 * of detail — both tuned against a 360 px phone canvas, which is 12 px/s. On a
 * landscape screen the canvas is more than twice that wide and the same 30 s
 * wasted the extra pixels; on a narrower one it was already too dense. Deriving
 * the span from the measured width keeps the density constant instead.
 *
 * 25 px/s, not the 12 the old constants implied. At 12 a widened waveform put
 * 63 seconds on screen at once, which is a great deal of context for placing a
 * ten second window and makes the handles hard to land. At 25 a ten second
 * window is 250 px wide wherever it is drawn, which is enough to grab an edge,
 * and the detail view shows two to three windows of context rather than six.
 */
export const MIN_PX_PER_S = 25

/**
 * How many seconds the detail view shows at a given canvas width.
 *
 * `Infinity` before the canvas has been measured, so the first paint is the
 * whole clip and no overview strip flashes in and out. The floor at
 * `MAX_WINDOW_S` stops a narrow canvas from showing less than a full window,
 * which would make the crop handles unreachable.
 */
export function detailSpanS(width: number): number {
  if (!(width > 0)) return Infinity
  return Math.max(MAX_WINDOW_S, width / MIN_PX_PER_S)
}

const spanFrom = (fromS: number, durationS: number, spanS: number): TimeRange => {
  const clamped = Math.max(0, Math.min(fromS, durationS - spanS))
  return { fromS: clamped, toS: clamped + spanS }
}

const centred = (sel: Selection, durationS: number, spanS: number): TimeRange =>
  spanFrom((sel.startS + sel.endS) / 2 - spanS / 2, durationS, spanS)

/**
 * The visible detail range for a selection.
 *
 * `prev` is kept whenever the selection still fits inside it, so the waveform
 * stands still while a window is dragged; only a window pushed past an edge
 * scrolls the view, and then by the smallest amount that brings it back in.
 * Re-centring on every change would make the view chase the finger and double
 * the apparent drag speed.
 *
 * A `prev` of a different span is not kept: it comes from a canvas that has
 * since been resized, or from the zoomed window a result left behind, and in
 * both cases the point is to get back to the span this width asks for.
 */
export function nextDetailRange(
  prev: TimeRange | undefined,
  sel: Selection,
  durationS: number,
  spanS: number,
): TimeRange {
  if (durationS <= spanS) return { fromS: 0, toS: durationS }
  if (!prev || Math.abs(prev.toS - prev.fromS - spanS) > 1e-6) return centred(sel, durationS, spanS)
  if (sel.startS >= prev.fromS && sel.endS <= prev.toS) return prev
  if (sel.startS < prev.fromS) return spanFrom(sel.startS, durationS, spanS)
  return spanFrom(sel.endS - spanS, durationS, spanS)
}
