/** A time window inside a clip, in absolute seconds. */
export interface Selection {
  startS: number
  endS: number
}

export const MIN_WINDOW_S = 1
export const MAX_WINDOW_S = 10

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)

export function defaultSelection(durationS: number): Selection {
  return { startS: 0, endS: Math.min(MAX_WINDOW_S, durationS) }
}

/** Move the left edge; the right edge stays. Length stays within [MIN, MAX]. */
export function setStart(sel: Selection, startS: number, durationS: number): Selection {
  const lo = Math.max(0, sel.endS - MAX_WINDOW_S)
  const hi = Math.min(durationS, sel.endS - MIN_WINDOW_S)
  return { startS: clamp(startS, lo, hi), endS: sel.endS }
}

/** Move the right edge; the left edge stays. Length stays within [MIN, MAX]. */
export function setEnd(sel: Selection, endS: number, durationS: number): Selection {
  const lo = Math.max(0, sel.startS + MIN_WINDOW_S)
  const hi = Math.min(durationS, sel.startS + MAX_WINDOW_S)
  return { startS: sel.startS, endS: clamp(endS, lo, hi) }
}

/** Shift the whole window; length is preserved exactly, clamped to the clip. */
export function moveBy(sel: Selection, deltaS: number, durationS: number): Selection {
  const len = sel.endS - sel.startS
  const startS = clamp(sel.startS + deltaS, 0, Math.max(0, durationS - len))
  return { startS, endS: startS + len }
}

export const selectionLength = (sel: Selection) => sel.endS - sel.startS
