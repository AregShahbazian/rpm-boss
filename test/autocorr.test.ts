import { describe, expect, it } from 'vitest'
import { MAX_RATE, median, rateFromEnvelope, windowEstimate } from '../src/dsp/autocorr'

const SR = 16000

/** A smooth positive bump once per period, the shape the envelope produces. */
function bumps(durationS: number, rate: number, sampleRate = SR): Float64Array {
  const n = Math.round(durationS * sampleRate)
  const period = sampleRate / rate
  return Float64Array.from({ length: n }, (_, i) => {
    const phase = (i % period) / period
    return 0.2 + Math.exp(-((phase - 0.25) ** 2) / 0.004)
  })
}

/** mulberry32: small, seeded, and free of the precision traps of a plain LCG. */
function random(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('median', () => {
  it('takes the middle of an odd count and the mean of an even one', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 3, 2])).toBe(2.5)
  })
})

describe('windowEstimate', () => {
  it.each([10, 13, 15, 22, 40])('recovers a rate of %i per second', (rate) => {
    const got = windowEstimate(bumps(1, rate), SR)
    expect(got?.pulsesPerS).toBeCloseTo(rate, 1)
  })

  it('recovers a rate whose period is not a whole number of samples', () => {
    // 16000 / 13.7 = 1167.88 samples. Whole-sample lags would give 13.694 or
    // 13.706; the parabolic refinement has to do better than that.
    const got = windowEstimate(bumps(1, 13.7), SR)
    expect(got?.pulsesPerS).toBeCloseTo(13.7, 2)
  })

  it('scores a clear rhythm high and noise low', () => {
    const engine = windowEstimate(bumps(1, 15), SR)
    const noise = windowEstimate(Float64Array.from({ length: SR }, random(7)), SR)

    expect(engine?.confidence).toBeGreaterThan(0.5)
    expect(noise?.confidence).toBeLessThan(0.35)
  })

  it('never reports a negative or absurd rate on degenerate audio', () => {
    // A near-constant window with a whisper of drift: the autocorrelation has
    // no real maximum, and the parabolic fit used to run away with the lag.
    const odd = Float64Array.from({ length: SR }, (_, i) => 0.5 + (i % 3) * 1e-9)
    const got = windowEstimate(odd, SR)
    if (got) {
      expect(got.pulsesPerS).toBeGreaterThan(0)
      expect(got.pulsesPerS).toBeLessThanOrEqual(MAX_RATE * 1.1)
    }
  })

  it('gives up on a flat window', () => {
    expect(windowEstimate(new Float64Array(SR), SR)).toBeUndefined()
  })

  it('gives up when the window is shorter than the slowest lag', () => {
    expect(windowEstimate(bumps(0.1, 15), SR)).toBeUndefined()
  })
})

describe('rateFromEnvelope', () => {
  it('pools whole windows and ignores the short tail', () => {
    const got = rateFromEnvelope(bumps(3.4, 16), SR)
    expect(got?.pulsesPerS).toBeCloseTo(16, 1)
  })

  it('ignores one wild window rather than averaging it in', () => {
    const clean = bumps(5, 15)
    const spoiled = Float64Array.from(clean)
    for (let i = 2 * SR; i < 3 * SR; i++) spoiled[i] = i % 97 === 0 ? 8 : 0.1

    expect(rateFromEnvelope(spoiled, SR)?.pulsesPerS).toBeCloseTo(15, 1)
  })

  it('returns undefined when no window holds anything', () => {
    expect(rateFromEnvelope(new Float64Array(3 * SR), SR)).toBeUndefined()
  })
})
