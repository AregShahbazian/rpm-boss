import { describe, expect, it } from 'vitest'
import { autocorrelate, fft, ifft, nextPowerOfTwo } from '../src/dsp/fft'

/** The definition, for checking the fast version against. */
function slowAutocorrelate(x: Float64Array, maxLag: number): Float64Array {
  const out = new Float64Array(maxLag + 1)
  for (let lag = 0; lag <= maxLag; lag++) {
    let sum = 0
    for (let i = 0; i + lag < x.length; i++) sum += x[i] * x[i + lag]
    out[lag] = sum
  }
  return out
}

describe('fft', () => {
  it('rounds a power of two up', () => {
    expect(nextPowerOfTwo(1)).toBe(1)
    expect(nextPowerOfTwo(1000)).toBe(1024)
    expect(nextPowerOfTwo(1024)).toBe(1024)
  })

  it('rejects a length that is not a power of two', () => {
    expect(() => fft(new Float64Array(3), new Float64Array(3))).toThrow(RangeError)
  })

  it('puts a pure tone in one bin', () => {
    const n = 64
    const re = Float64Array.from({ length: n }, (_, i) => Math.cos((2 * Math.PI * 5 * i) / n))
    const im = new Float64Array(n)
    fft(re, im)
    const power = Array.from(re, (v, i) => Math.hypot(v, im[i]))

    expect(power[5]).toBeCloseTo(n / 2, 6)
    expect(power[n - 5]).toBeCloseTo(n / 2, 6)
    expect(power[7]).toBeCloseTo(0, 6)
  })

  it('round-trips through the inverse', () => {
    const n = 128
    const original = Float64Array.from({ length: n }, (_, i) => Math.sin(i) * i)
    const re = Float64Array.from(original)
    const im = new Float64Array(n)
    fft(re, im)
    ifft(re, im)
    for (let i = 0; i < n; i++) expect(re[i]).toBeCloseTo(original[i], 9)
  })
})

describe('autocorrelate', () => {
  it('matches the direct sum', () => {
    const x = Float64Array.from({ length: 700 }, (_, i) => Math.sin(i / 3) + Math.sin(i / 11))
    const fast = autocorrelate(x, 200)
    const slow = slowAutocorrelate(x, 200)
    for (let lag = 0; lag <= 200; lag++) expect(fast[lag]).toBeCloseTo(slow[lag], 6)
  })

  it('peaks at the period of a periodic signal', () => {
    const period = 40
    const x = Float64Array.from({ length: 800 }, (_, i) => Math.sin((2 * Math.PI * i) / period))
    const ac = autocorrelate(x, 120)
    let best = 5
    for (let lag = 5; lag < ac.length; lag++) if (ac[lag] > ac[best]) best = lag

    expect(best).toBe(period)
  })
})
