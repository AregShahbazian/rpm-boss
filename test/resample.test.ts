import { describe, expect, it } from 'vitest'
import { lowpassFir, resampleTo16k, toMono } from '../src/audio/resample'

const tone = (hz: number, rate: number, seconds: number, amp = 1) =>
  Float32Array.from({ length: Math.round(rate * seconds) }, (_, i) => amp * Math.sin((2 * Math.PI * hz * i) / rate))

const zeroCrossingHz = (x: Float32Array, rate: number) => {
  let crossings = 0
  for (let i = 1; i < x.length; i++) if (x[i - 1] < 0 !== x[i] < 0) crossings++
  return (crossings / 2) / (x.length / rate)
}

const peak = (x: Float32Array) => x.reduce((m, v) => Math.max(m, Math.abs(v)), 0)

describe('toMono', () => {
  it('averages channels', () => {
    const m = toMono([Float32Array.of(1, 0.5), Float32Array.of(0, 0.5)])
    expect(Array.from(m)).toEqual([0.5, 0.5])
  })
  it('copies a single channel', () => {
    const src = Float32Array.of(0.1, 0.2)
    const m = toMono([src])
    expect(m).not.toBe(src)
    expect(Array.from(m)).toEqual([expect.closeTo(0.1, 6), expect.closeTo(0.2, 6)])
  })
})

describe('resampleTo16k', () => {
  it('passes 16 kHz through untouched', () => {
    const x = tone(440, 16000, 0.5)
    expect(resampleTo16k(x, 16000)).toBe(x)
  })

  it('downsamples 48 kHz stereo 440 Hz to 16 kHz keeping the pitch', () => {
    const l = tone(440, 48000, 1)
    const r = tone(440, 48000, 1, 0.5)
    const y = resampleTo16k(toMono([l, r]), 48000)
    expect(Math.abs(y.length - l.length / 3)).toBeLessThanOrEqual(1)
    expect(zeroCrossingHz(y, 16000)).toBeCloseTo(440, -1)
    expect(peak(y)).toBeCloseTo(0.75, 1)
  })

  it('gives the expected length for 44.1 kHz', () => {
    const y = resampleTo16k(tone(300, 44100, 1), 44100)
    expect(Math.abs(y.length - 16000)).toBeLessThanOrEqual(1)
  })

  it('keeps 6 kHz and attenuates 7.9 kHz at 48 kHz input', () => {
    const keep = resampleTo16k(tone(6000, 48000, 0.5), 48000)
    const drop = resampleTo16k(tone(7900, 48000, 0.5), 48000)
    expect(peak(keep)).toBeGreaterThan(0.8)
    expect(peak(drop)).toBeLessThan(0.5)
  })

  it('lowpassFir preserves DC gain', () => {
    const dc = new Float32Array(2000).fill(0.5)
    const y = lowpassFir(dc, 48000, 7200)
    expect(y[1000]).toBeCloseTo(0.5, 3)
  })
})
