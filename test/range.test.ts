import { describe, expect, it } from 'vitest'
import { detailSpanS, MIN_PX_PER_S, nextDetailRange } from '../src/waveform/range'

/** The span the old constants assumed: a 360 px phone canvas at 12 px/s. */
const SPAN = 30

describe('detailSpanS', () => {
  it('reproduces the old 30 s at the width the constant assumed', () => {
    expect(detailSpanS(360)).toBe(SPAN)
  })

  it('keeps the density constant as the canvas grows', () => {
    expect(detailSpanS(760)).toBeCloseTo(760 / MIN_PX_PER_S)
    expect(detailSpanS(1080)).toBeCloseTo(90)
  })

  it('never shows less than a full window', () => {
    expect(detailSpanS(60)).toBe(10)
  })

  it('is infinite before the canvas has been measured', () => {
    expect(detailSpanS(0)).toBe(Infinity)
    expect(detailSpanS(Number.NaN)).toBe(Infinity)
  })
})

describe('nextDetailRange', () => {
  it('is the whole clip when the clip fits', () => {
    expect(nextDetailRange(undefined, { startS: 0, endS: 10 }, 15.9, SPAN)).toEqual({ fromS: 0, toS: 15.9 })
  })

  it('is the whole clip while the width is still unknown', () => {
    expect(nextDetailRange(undefined, { startS: 0, endS: 10 }, 127.2, detailSpanS(0))).toEqual({
      fromS: 0,
      toS: 127.2,
    })
  })

  it('centres on the selection the first time and clamps at both ends', () => {
    expect(nextDetailRange(undefined, { startS: 100, endS: 110 }, 127.2, SPAN)).toEqual({ fromS: 90, toS: 120 })
    expect(nextDetailRange(undefined, { startS: 0, endS: 10 }, 127.2, SPAN)).toEqual({ fromS: 0, toS: 30 })
    expect(nextDetailRange(undefined, { startS: 117, endS: 127 }, 127.2, SPAN)).toEqual({ fromS: 97.2, toS: 127.2 })
  })

  it('holds still — same object — while the window stays visible', () => {
    const prev = { fromS: 90, toS: 120 }
    expect(nextDetailRange(prev, { startS: 91, endS: 101 }, 127.2, SPAN)).toBe(prev)
    expect(nextDetailRange(prev, { startS: 110, endS: 120 }, 127.2, SPAN)).toBe(prev)
    expect(nextDetailRange(prev, { startS: 90, endS: 91 }, 127.2, SPAN)).toBe(prev)
  })

  it('scrolls by the smallest amount that brings the window back in', () => {
    const prev = { fromS: 90, toS: 120 }
    expect(nextDetailRange(prev, { startS: 88, endS: 98 }, 127.2, SPAN)).toEqual({ fromS: 88, toS: 118 })
    expect(nextDetailRange(prev, { startS: 115, endS: 125 }, 127.2, SPAN)).toEqual({ fromS: 95, toS: 125 })
  })

  it('drops a previous range of a different span, however well the window fits', () => {
    // What the zoomed view left behind after a result, and what a rotation
    // leaves behind: the window fits, but the span is no longer the right one.
    const snapped = { fromS: 100, toS: 110 }
    expect(nextDetailRange(snapped, { startS: 100, endS: 110 }, 127.2, SPAN)).toEqual({ fromS: 90, toS: 120 })
  })
})
