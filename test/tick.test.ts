import { describe, expect, it } from 'vitest'
import { octaveKey } from '../src/ui/octave'
import { tickPositions, tickX } from '../src/ui/tick'

describe('tickX', () => {
  it('places the start, middle and end of the window', () => {
    expect(tickX(0, 10, 400)).toBe(0)
    expect(tickX(5, 10, 400)).toBe(200)
    expect(tickX(10, 10, 400)).toBe(400)
  })

  it('clamps a pulse that rounds past the end', () => {
    expect(tickX(10.0004, 10, 400)).toBe(400)
    expect(tickX(-0.001, 10, 400)).toBe(0)
  })

  it('returns zero rather than NaN for a degenerate window', () => {
    expect(tickX(1, 0, 400)).toBe(0)
    expect(tickX(1, 10, 0)).toBe(0)
  })

  it('lands within a pixel of the pulse it marks', () => {
    const width = 448
    const windowS = 10
    for (const t of [0.37, 1.11, 4.99, 9.62]) {
      expect(Math.abs(tickX(t, windowS, width) - (t / windowS) * width)).toBeLessThan(1)
    }
  })
})

describe('tickPositions', () => {
  it('keeps one tick per pixel column', () => {
    // Three pulses inside a single pixel: one tick, not three overlapping.
    expect(tickPositions([1.0, 1.001, 1.002], 10, 400)).toEqual([40])
  })

  it('keeps every tick when they are a pixel or more apart', () => {
    expect(tickPositions([0, 2.5, 5, 7.5, 10], 10, 400)).toEqual([0, 100, 200, 300, 400])
  })

  it('handles an empty result', () => {
    expect(tickPositions([], 10, 400)).toEqual([])
  })
})

describe('octaveKey', () => {
  it('says a doubled reading means each mark is two combustions', () => {
    // 12.08 pulses/s is 1449 rpm raw; the range pushed it to 2898.
    expect(octaveKey(2898, 12.08)).toBe('octaveUp')
  })

  it('says a halved reading means two marks are one combustion', () => {
    expect(octaveKey(725, 12.08)).toBe('octaveDown')
  })
})
