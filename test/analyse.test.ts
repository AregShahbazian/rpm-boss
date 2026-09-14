import { describe, expect, it } from 'vitest'
import { analyse, resolveOctave, toRpm } from '../src/dsp/analyse'
import { MIN_ANALYSIS_S } from '../src/dsp/types'

const SR = 16000

/**
 * `carrierHz` is the exhaust note. At 200 pulses a second the default 350 Hz
 * would put 1.75 cycles in each pulse, so consecutive pulses start in opposite
 * polarity and the bandpass's tail from one meets the next as a different
 * shape: an engine that alternates, which no real one does. A whole number of
 * cycles per pulse keeps every pulse the same.
 */
function engineLike(durationS: number, rate: number, carrierHz = 350): Float32Array {
  const n = Math.round(durationS * SR)
  const period = SR / rate
  return Float32Array.from({ length: n }, (_, i) => {
    const phase = (i % period) / period
    return Math.exp(-phase * 20) * Math.sin((2 * Math.PI * carrierHz * i) / SR)
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

  it('counts one on a two-stroke, which is half the rpm', () => {
    expect(toRpm(13.4, 1)).toBeCloseTo(804, 0)
    expect(toRpm(13.4, 1)).toBe(toRpm(13.4) / 2)
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

  it('keeps the measurement when it fits, even if an octave fits better', () => {
    // 800 and 1600 both sit inside, and 1600 is nearer the midpoint of 1800.
    // The measurement still wins: the range is there to catch an estimate that
    // cannot be right, not to second-guess one that can.
    expect(resolveOctave(800, { minRpm: 700, maxRpm: 2900 })).toBe(800)
  })

  it('does not halve a correct estimate on a tie', () => {
    // Range midpoint 1500, so 1000 and 2000 are equally close. Preferring the
    // first candidate would report half the real figure.
    expect(resolveOctave(2000, { minRpm: 900, maxRpm: 2100 })).toBe(2000)
  })

  it('never has two octaves to choose between', () => {
    // A range holding both half and double holds the estimate between them, so
    // whenever an octave is picked it is the only one that fits.
    for (const rpm of [800, 1450, 2000]) {
      for (const range of [{ minRpm: 300, maxRpm: 3000 }, { minRpm: 1300, maxRpm: 1700 }]) {
        const fits = (c: number) => c >= range.minRpm && c <= range.maxRpm
        const octaves = [rpm / 2, rpm * 2].filter(fits)
        expect(fits(rpm) || octaves.length <= 1).toBe(true)
      }
    }
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

  it('halves the reading for a two-stroke, and says which engine it read', () => {
    const four = analyse(engineLike(4, 13.5), SR)
    const two = analyse(engineLike(4, 13.5), SR, undefined, 1)
    if (!four.ok || !two.ok) throw new Error('both should read')

    // Not to the digit: the two-stroke chain smooths at twice the rate, so the
    // refined lag differs in its fourth figure. The reading is the same.
    expect(two.rpm).toBeCloseTo(four.rpm / 2, -1)
    expect(two.revsPerPulse).toBe(1)
    expect(four.revsPerPulse).toBe(2)
    // The same sound; only what it means moved.
    expect(Math.abs(two.pulsesPerS - four.pulsesPerS) / four.pulsesPerS).toBeLessThan(0.001)
  })

  it('reads a two-stroke at the top of its dial', () => {
    // 200 combustions a second: 12,000 rpm on a two-stroke, and twice the
    // fastest rhythm the four-stroke chain ever looks for.
    const got = analyse(engineLike(4, 200, 400), SR, undefined, 1)
    if (!got.ok) throw new Error(got.code)
    expect(got.rpm).toBeCloseTo(12_000, -2)
    expect(got.pulsesPerS).toBeCloseTo(200, 0)
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
