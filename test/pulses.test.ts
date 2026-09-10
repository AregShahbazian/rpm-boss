import { describe, expect, it } from 'vitest'
import { enforceSpacing, findPulses, localMaxima, prominences, rateFromPulses } from '../src/dsp/pulses'

const of = (...values: number[]) => Float64Array.from(values)

describe('localMaxima', () => {
  it('finds interior maxima and ignores the ends', () => {
    expect(localMaxima(of(5, 1, 3, 1, 4, 1, 6))).toEqual([2, 4])
  })

  it('reports the middle of a plateau', () => {
    expect(localMaxima(of(0, 2, 2, 2, 0))).toEqual([2])
  })

  it('finds nothing in a monotonic run', () => {
    expect(localMaxima(of(1, 2, 3, 4, 5))).toEqual([])
  })
})

describe('prominences', () => {
  it('measures against the higher of the two flanking valleys', () => {
    //            0  1  2  3  4  5  6
    const x = of(0, 3, 1, 5, 2, 4, 0)
    // Peak at 3 is the tallest: valleys are 0 on the left and 0 on the right.
    // Peak at 1 is hemmed in by the taller peak at 3, so its right valley is 1.
    expect(prominences(x, [1, 3, 5])).toEqual([2, 5, 2])
  })

  it('gives a lone bump its full height above the floor', () => {
    expect(prominences(of(0, 0, 7, 0, 0), [2])).toEqual([7])
  })
})

describe('enforceSpacing', () => {
  it('keeps the taller of two close peaks', () => {
    const x = of(0, 5, 0, 9, 0, 4, 0)
    expect(enforceSpacing(x, [1, 3, 5], 3)).toEqual([3])
  })

  it('keeps both when they are far enough apart', () => {
    const x = of(0, 5, 0, 0, 0, 4, 0)
    expect(enforceSpacing(x, [1, 5], 3)).toEqual([1, 5])
  })
})

describe('findPulses', () => {
  const sampleRate = 1000

  function train(durationS: number, rate: number): Float64Array {
    const n = durationS * sampleRate
    const period = sampleRate / rate
    return Float64Array.from({ length: n }, (_, i) => {
      const phase = (i % period) / period
      return Math.exp(-((phase - 0.2) ** 2) / 0.002)
    })
  }

  it('finds one pulse per period', () => {
    const pulses = findPulses(train(4, 15), 15, sampleRate)
    expect(pulses.length).toBe(60)
  })

  it('spaces them evenly', () => {
    const pulses = findPulses(train(4, 15), 15, sampleRate)
    // The period is 66.67 samples, so gaps alternate between 66 and 67.
    const gaps = pulses.slice(1).map((p, i) => p - pulses[i])
    for (const gap of gaps) expect(Math.abs(gap - sampleRate / 15)).toBeLessThanOrEqual(1)
  })

  it('ignores ripple that is too small to be a combustion', () => {
    const base = train(4, 15)
    for (let i = 0; i < base.length; i++) base[i] += 0.01 * Math.sin(i)
    expect(findPulses(base, 15, sampleRate).length).toBe(60)
  })
})

describe('rateFromPulses', () => {
  it('divides the count by the duration', () => {
    expect(rateFromPulses(60, 4000, 1000)).toBe(15)
  })
})
