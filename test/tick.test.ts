import { describe, expect, it } from 'vitest'
import { octaveKey } from '../src/ui/octave'
import { tickPositionsInRange } from '../src/ui/tick'



describe('octaveKey', () => {
  it('says a doubled reading means each mark is two combustions', () => {
    // 12.08 pulses/s is 1449 rpm raw; the range pushed it to 2898.
    expect(octaveKey(2898, 12.08)).toBe('octaveUp')
  })

  it('says a halved reading means two marks are one combustion', () => {
    expect(octaveKey(725, 12.08)).toBe('octaveDown')
  })
})

describe('tickPositionsInRange', () => {
  const range = { fromS: 10, toS: 40 }

  it('offsets pulse times by the window start before mapping', () => {
    // A pulse 5 s into a window that starts at 20 s is at 25 s absolute,
    // half a second past the middle of a 30 s range drawn 300 px wide.
    expect(tickPositionsInRange([5], 20, range, 300)).toEqual([150])
  })

  it('drops pulses outside the visible range rather than clamping them', () => {
    // Absolute times 5, 10, 30 and 45 against a range of 10 to 40:
    // the first is before it and the last is after it.
    expect(tickPositionsInRange([0, 5, 25, 40], 5, range, 300)).toEqual([0, 200])
  })

  it('deduplicates to whole pixels', () => {
    expect(tickPositionsInRange([0, 0.01, 0.02], 10, range, 300)).toEqual([0])
  })

  it('is empty for a degenerate range or width', () => {
    expect(tickPositionsInRange([1], 0, { fromS: 5, toS: 5 }, 300)).toEqual([])
    expect(tickPositionsInRange([1], 0, range, 0)).toEqual([])
  })
})
