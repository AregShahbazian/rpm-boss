import { describe, expect, it } from 'vitest'
import { analyse, resolveOctave, toRpm } from '../src/dsp/analyse'
import { MIN_ANALYSIS_S } from '../src/dsp/types'

const SR = 16000

function engineLike(durationS: number, rate: number): Float32Array {
  const n = Math.round(durationS * SR)
  const period = SR / rate
  return Float32Array.from({ length: n }, (_, i) => {
    const phase = (i % period) / period
    return Math.exp(-phase * 20) * Math.sin((2 * Math.PI * 350 * i) / SR)
  })
}

function random(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1
  }
}

describe('toRpm', () => {
  it('counts two revolutions per combustion', () => {
    expect(toRpm(13.4)).toBeCloseTo(1608, 0)
  })
})

describe('resolveOctave', () => {
  it('leaves the estimate alone without a range', () => {
    expect(resolveOctave(800)).toBe(800)
  })

  it('doubles an estimate that reads half', () => {
    expect(resolveOctave(800, { minRpm: 1300, maxRpm: 1700 })).toBe(1600)
  })

  it('halves an estimate that reads double', () => {
    expect(resolveOctave(3200, { minRpm: 1300, maxRpm: 1700 })).toBe(1600)
  })

  it('keeps an estimate that already fits', () => {
    expect(resolveOctave(1500, { minRpm: 1300, maxRpm: 1700 })).toBe(1500)
  })

  it('takes the candidate nearest the middle when two fit', () => {
    // 800 and 1600 both sit inside; 1600 is nearer the midpoint of 1800.
    expect(resolveOctave(800, { minRpm: 700, maxRpm: 2900 })).toBe(1600)
  })

  it('ignores a range that nothing fits', () => {
    expect(resolveOctave(1500, { minRpm: 4000, maxRpm: 5000 })).toBe(1500)
  })

  it.each([
    ['inverted', { minRpm: 1700, maxRpm: 1300 }],
    ['zero width', { minRpm: 1500, maxRpm: 1500 }],
    ['non-positive', { minRpm: 0, maxRpm: 1700 }],
  ])('ignores a %s range', (_label, range) => {
    expect(resolveOctave(800, range)).toBe(800)
  })
})

describe('analyse', () => {
  it('reads a synthetic engine and reports its pulses', () => {
    const got = analyse(engineLike(4, 13.5), SR)
    if (!got.ok) throw new Error(got.message)

    expect(got.rpm).toBeCloseTo(1620, -1)
    expect(got.pulsesPerS).toBeCloseTo(13.5, 1)
    expect(got.peakPulsesPerS).toBeCloseTo(13.5, 0)
    expect(got.pulseTimesS.length).toBe(54)
    expect(got.octaveAdjusted).toBe(false)
  })

  it('marks the result when the range moved it an octave', () => {
    const got = analyse(engineLike(4, 13.5), SR, { minRpm: 3000, maxRpm: 3500 })
    if (!got.ok) throw new Error(got.message)

    expect(got.rpm).toBeCloseTo(3240, -1)
    expect(got.octaveAdjusted).toBe(true)
    // The underlying measurement is untouched; only the reported rpm moved.
    expect(got.pulsesPerS).toBeCloseTo(13.5, 1)
  })

  it('refuses a window under the minimum', () => {
    const got = analyse(engineLike(MIN_ANALYSIS_S - 0.1, 13.5), SR)
    expect(got.ok).toBe(false)
    if (!got.ok) expect(got.code).toBe('too-short')
  })

  it('refuses noise rather than reporting a number', () => {
    const got = analyse(Float32Array.from({ length: SR * 4 }, random(3)), SR)
    expect(got.ok).toBe(false)
    if (!got.ok) expect(got.code).toBe('no-signal')
  })

  it('refuses silence', () => {
    const got = analyse(new Float32Array(SR * 4), SR)
    expect(got.ok).toBe(false)
    if (!got.ok) expect(got.code).toBe('no-signal')
  })

  it('places the pulses evenly through the window', () => {
    const got = analyse(engineLike(4, 13.5), SR)
    if (!got.ok) throw new Error(got.message)

    const gaps = got.pulseTimesS.slice(1).map((t, i) => t - got.pulseTimesS[i])
    for (const gap of gaps) expect(gap).toBeCloseTo(1 / 13.5, 2)
  })
})
