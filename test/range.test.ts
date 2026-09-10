import { describe, expect, it } from 'vitest'
import { nextDetailRange } from '../src/waveform/range'

describe('nextDetailRange', () => {
  it('is the whole clip when the clip fits', () => {
    expect(nextDetailRange(undefined, { startS: 0, endS: 10 }, 15.9)).toEqual({ fromS: 0, toS: 15.9 })
  })

  it('centres on the selection the first time and clamps at both ends', () => {
    expect(nextDetailRange(undefined, { startS: 100, endS: 110 }, 127.2)).toEqual({ fromS: 90, toS: 120 })
    expect(nextDetailRange(undefined, { startS: 0, endS: 10 }, 127.2)).toEqual({ fromS: 0, toS: 30 })
    expect(nextDetailRange(undefined, { startS: 117, endS: 127 }, 127.2)).toEqual({ fromS: 97.2, toS: 127.2 })
  })

  it('holds still — same object — while the window stays visible', () => {
    const prev = { fromS: 90, toS: 120 }
    expect(nextDetailRange(prev, { startS: 91, endS: 101 }, 127.2)).toBe(prev)
    expect(nextDetailRange(prev, { startS: 110, endS: 120 }, 127.2)).toBe(prev)
    expect(nextDetailRange(prev, { startS: 90, endS: 91 }, 127.2)).toBe(prev)
  })

  it('scrolls by the smallest amount that brings the window back in', () => {
    const prev = { fromS: 90, toS: 120 }
    expect(nextDetailRange(prev, { startS: 88, endS: 98 }, 127.2)).toEqual({ fromS: 88, toS: 118 })
    expect(nextDetailRange(prev, { startS: 115, endS: 125 }, 127.2)).toEqual({ fromS: 95, toS: 125 })
  })
})
