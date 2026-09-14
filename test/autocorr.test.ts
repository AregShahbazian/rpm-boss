import { describe, expect, it } from 'vitest'
import {
  fundamental,
  MAX_RATE,
  MIN_RATE,
  median,
  peaks,
  rateFromEnvelope,
  rateRangeFor,
  SEARCH_HEADROOM,
  windowEstimate,
} from '../src/dsp/autocorr'
import { MAX_RPM, REVS_PER_PULSE } from '../src/dsp/types'

const SR = 16000

describe('the searched range', () => {
  // The face of the tachometer and the estimator's ceiling are one number in
  // two places. If a refactor ever states MAX_RATE on its own again, this is
  // what says so.
  it('derives its ceiling from the dial', () => {
    expect(MAX_RATE).toBe(100)
    expect(MAX_RATE * 60 * REVS_PER_PULSE).toBe(MAX_RPM)
  })

  it('reaches down to 600 rpm', () => {
    expect(MIN_RATE * 60 * REVS_PER_PULSE).toBe(600)
  })

  it('searches a tenth past either end of the dial', () => {
    const four = rateRangeFor(2)
    expect(four.maxRate).toBeCloseTo(MAX_RATE * SEARCH_HEADROOM, 9)
    expect(four.minRate).toBeCloseTo(MIN_RATE / SEARCH_HEADROOM, 9)
  })

  it('is the same dial, twice as fast, on a two-stroke', () => {
    // 600 to 12,000 rpm either way; a two-stroke fires twice per turn, so its
    // combustions come twice as fast at both ends.
    const four = rateRangeFor(2)
    const two = rateRangeFor(1)
    expect(two.minRate).toBeCloseTo(four.minRate * 2, 9)
    expect(two.maxRate).toBeCloseTo(four.maxRate * 2, 9)
  })
})

/**
 * A correlation function built by hand: a fall from lag zero, then bumps of
 * chosen heights at chosen lags. What the picker sees, without the engine.
 */
function correlation(length: number, bumps: [lag: number, height: number][], falloff = 0): Float64Array {
  const ac = new Float64Array(length)
  for (let i = 0; i < length; i++) ac[i] = falloff * Math.exp(-i / 400)
  for (const [at, height] of bumps) {
    for (let i = Math.max(0, at - 12); i <= Math.min(length - 1, at + 12); i++) {
      ac[i] += height * Math.exp(-((i - at) ** 2) / 18)
    }
  }
  return ac
}

describe('fundamental', () => {
  it('takes the period when it is the tallest peak', () => {
    const ac = correlation(2000, [[400, 0.9], [800, 0.8], [1200, 0.7]])
    expect(fundamental(ac, 72, 1760)).toBe(400)
  })

  it('takes the period over a taller multiple of it', () => {
    // At the top of the dial the teeth of the comb are equal within noise, and
    // the tallest can be any of them. Three times the period is tallest here.
    const ac = correlation(2000, [[100, 0.50], [200, 0.52], [300, 0.56], [400, 0.49], [500, 0.51], [600, 0.47]])
    expect(fundamental(ac, 72, 1760)).toBe(100)
  })

  it('does not take a sound that happens twice a cycle for the period', () => {
    // Every other tooth weak: something at half the period, but not the
    // period. The seven ground-truth four-strokes score up to 0.45 here.
    const ac = correlation(4000, [[600, 0.35], [1200, 0.85], [1800, 0.30], [2400, 0.80], [3000, 0.28]])
    expect(fundamental(ac, 145, 3520)).toBe(1200)
  })

  it('does not take a ripple with nothing at its multiples for the period', () => {
    // An exhaust ring rectified: one tall tooth at a short lag that decays to
    // nothing along its comb, against a period twelve times as long.
    const ac = correlation(2000, [[133, 0.58], [266, 0.35], [399, 0.18], [532, 0.02], [1600, 0.79]])
    expect(fundamental(ac, 72, 1760)).toBe(1600)
  })

  it('never takes the fall from lag zero for a peak', () => {
    // Wide pulses: the correlation is still falling at the shortest lag
    // searched, and higher there than at the period.
    const ac = correlation(2000, [[1600, 0.79]], 1.0)
    expect(ac[72]).toBeGreaterThan(ac[1600])
    expect(peaks(ac, 72, 1760)).not.toContain(72)
    expect(fundamental(ac, 72, 1760)).toBe(1600)
  })

  it('gives up on a correlation with no peak in range', () => {
    expect(fundamental(correlation(2000, [], 1.0), 72, 1760)).toBeUndefined()
  })
})

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

  it('recovers a rate just past the top of the dial, which the headroom is for', () => {
    // 105 pulses a second is 12,600 rpm on a four-stroke. An engine at 12,000
    // has cycles this short on the fast side of its jitter, and each one has
    // to be findable or the window falls to a subharmonic.
    const got = windowEstimate(bumps(1, 105), SR)
    expect(got?.pulsesPerS).toBeCloseTo(105, 0)
  })

  it('recovers a two-stroke at the top of its dial', () => {
    // 200 a second is 12,000 rpm on a two-stroke — twice what the four-stroke
    // range ends at, and out of reach without the scaled range.
    const got = windowEstimate(bumps(1, 200), SR, rateRangeFor(1))
    expect(got?.pulsesPerS).toBeCloseTo(200, 0)
    expect(windowEstimate(bumps(1, 200), SR)?.pulsesPerS).not.toBeCloseTo(200, 0)
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
