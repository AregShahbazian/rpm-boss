import { describe, expect, it } from 'vitest'
import { defaultSelection, MIN_WINDOW_S, moveBy, selectionLength, setEnd, setStart } from '../src/waveform/selection'

describe('selection', () => {
  it('defaults to the first 10 s or the whole clip', () => {
    expect(defaultSelection(6.4)).toEqual({ startS: 0, endS: 6.4 })
    expect(defaultSelection(15.9)).toEqual({ startS: 0, endS: 10 })
  })

  it('setEnd holds at 10 s and never leaves the clip', () => {
    const s = { startS: 2, endS: 5 }
    expect(setEnd(s, 30, 15.9)).toEqual({ startS: 2, endS: 12 })
    expect(setEnd({ startS: 10, endS: 12 }, 30, 15.9)).toEqual({ startS: 10, endS: 15.9 })
  })

  it('setStart / setEnd hold the minimum window', () => {
    expect(setStart({ startS: 2, endS: 5 }, 4.9, 15.9)).toEqual({ startS: 5 - MIN_WINDOW_S, endS: 5 })
    expect(setEnd({ startS: 2, endS: 5 }, 2.1, 15.9)).toEqual({ startS: 2, endS: 2 + MIN_WINDOW_S })
  })

  it('setStart holds at 10 s from the end and at 0', () => {
    expect(setStart({ startS: 8, endS: 15 }, 1, 15.9)).toEqual({ startS: 5, endS: 15 })
    expect(setStart({ startS: 3, endS: 6 }, -4, 15.9)).toEqual({ startS: 0, endS: 6 })
  })

  it('moveBy preserves length and clamps at both ends', () => {
    const s = { startS: 2.25, endS: 7.75 }
    const moved = moveBy(s, 1.1, 15.9)
    expect(selectionLength(moved)).toBeCloseTo(5.5, 9)
    expect(moved.startS).toBeCloseTo(3.35, 9)
    expect(moveBy(s, -10, 15.9)).toEqual({ startS: 0, endS: 5.5 })
    const end = moveBy(s, 100, 15.9)
    expect(end.endS).toBeCloseTo(15.9, 9)
    expect(selectionLength(end)).toBeCloseTo(5.5, 9)
  })

  it('moveBy on a window as long as the clip does nothing', () => {
    expect(moveBy({ startS: 0, endS: 6.4 }, 3, 6.4)).toEqual({ startS: 0, endS: 6.4 })
  })
})
