import { describe, expect, it } from 'vitest'
import { detailRange } from '../src/waveform/range'

describe('detailRange', () => {
  it('is the whole clip when the clip fits', () => {
    expect(detailRange({ startS: 0, endS: 10 }, 15.9)).toEqual({ fromS: 0, toS: 15.9 })
  })
  it('centres a 30 s span on the selection and clamps at both ends', () => {
    expect(detailRange({ startS: 100, endS: 110 }, 127.2)).toEqual({ fromS: 90, toS: 120 })
    expect(detailRange({ startS: 0, endS: 10 }, 127.2)).toEqual({ fromS: 0, toS: 30 })
    expect(detailRange({ startS: 117, endS: 127 }, 127.2)).toEqual({ fromS: 97.2, toS: 127.2 })
  })
})
