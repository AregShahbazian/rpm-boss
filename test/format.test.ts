import { describe, expect, it } from 'vitest'
import { formatTime } from '../src/ui/format'

describe('formatTime', () => {
  it('carries into minutes when the rounding does', () => {
    expect(formatTime(59.97, 1)).toBe('1:00.0')
    expect(formatTime(119.96, 1)).toBe('2:00.0')
    expect(formatTime(59.7)).toBe('1:00')
  })
  it('pads seconds', () => {
    expect(formatTime(5.55, 1)).toBe('0:05.6')
    expect(formatTime(65)).toBe('1:05')
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(0, 1)).toBe('0:00.0')
  })
  it('never shows negative time', () => {
    expect(formatTime(-3)).toBe('0:00')
  })
})
