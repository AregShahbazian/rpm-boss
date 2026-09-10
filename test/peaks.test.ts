import { describe, expect, it } from 'vitest'
import { computePeaks } from '../src/waveform/peaks'

const tone = (hz: number, rate: number, seconds: number) =>
  Float32Array.from({ length: Math.round(rate * seconds) }, (_, i) => Math.sin((2 * Math.PI * hz * i) / rate))

describe('computePeaks', () => {
  it('a 1 kHz tone gives ±1 in every column', () => {
    const p = computePeaks(tone(1000, 16000, 1), 0, 16000, 100)
    for (let c = 0; c < 100; c++) {
      expect(p.max[c]).toBeCloseTo(1, 1)
      expect(p.min[c]).toBeCloseTo(-1, 1)
    }
  })
  it('silence gives zeros', () => {
    const p = computePeaks(new Float32Array(1600), 0, 1600, 10)
    expect(Array.from(p.max)).toEqual(new Array(10).fill(0))
  })
  it('repeats samples when there are more columns than samples', () => {
    const p = computePeaks(Float32Array.of(0.2, -0.4), 0, 2, 6)
    expect(Array.from(p.max)).toEqual([0.2, 0.2, 0.2, -0.4, -0.4, -0.4].map((v) => expect.closeTo(v, 6)))
  })
  it('a ramp gives monotonic maxima and respects the span', () => {
    const ramp = Float32Array.from({ length: 1000 }, (_, i) => i / 1000)
    const p = computePeaks(ramp, 500, 1000, 5)
    expect(p.max[0]).toBeGreaterThan(0.5)
    for (let c = 1; c < 5; c++) expect(p.max[c]).toBeGreaterThan(p.max[c - 1])
    expect(p.min[0]).toBeCloseTo(0.5, 2)
  })
})
