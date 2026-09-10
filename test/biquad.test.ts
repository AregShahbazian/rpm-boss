import { describe, expect, it } from 'vitest'
import { filtfilt, highpass, lowpass, magnitude, type Section } from '../src/dsp/biquad'

const SR = 16000

/** From scipy.signal.butter(2, f, btype=..., fs=16000, output='sos'). */
const SCIPY: Record<string, Section> = {
  'highpass 60': { b0: 0.9834772, b1: -1.96695441, b2: 0.9834772, a1: -1.96668139, a2: 0.96722743 },
  'lowpass 2000': { b0: 0.09763107, b1: 0.19526215, b2: 0.09763107, a1: -0.94280904, a2: 0.33333333 },
  'lowpass 150': { b0: 0.00083254, b1: 0.00166508, b2: 0.00083254, a1: -1.91674122, a2: 0.92007137 },
}

describe('section design', () => {
  it.each([
    ['highpass 60', highpass(60, SR)],
    ['lowpass 2000', lowpass(2000, SR)],
    ['lowpass 150', lowpass(150, SR)],
  ])('%s matches scipy', (name, got) => {
    const want = SCIPY[name]
    for (const key of ['b0', 'b1', 'b2', 'a1', 'a2'] as const) {
      expect(got[key]).toBeCloseTo(want[key], 7)
    }
  })

  it('rejects a cutoff at or above Nyquist', () => {
    expect(() => lowpass(8000, SR)).toThrow(RangeError)
    expect(() => highpass(0, SR)).toThrow(RangeError)
  })
})

describe('magnitude response', () => {
  it('is -3 dB at the corner of each section', () => {
    expect(magnitude([lowpass(2000, SR)], 2000, SR)).toBeCloseTo(Math.SQRT1_2, 3)
    expect(magnitude([highpass(60, SR)], 60, SR)).toBeCloseTo(Math.SQRT1_2, 3)
  })

  // Gains from scipy.signal.sosfreqz over the same cascade.
  it.each([
    [10, 0.027765],
    [60, 0.707107],
    [500, 0.998303],
    [2000, 0.707107],
    [6000, 0.029425],
  ])('at %i Hz the band gain matches scipy', (hz, want) => {
    expect(magnitude([highpass(60, SR), lowpass(2000, SR)], hz, SR)).toBeCloseTo(want, 6)
  })

  it('rolls off below the analog asymptote near Nyquist', () => {
    // A second-order analog lowpass would drop 4x per octave. The bilinear
    // transform warps the axis, so a digital one drops faster as it nears
    // Nyquist: 5.82x from 2 kHz to 4 kHz, which scipy agrees with exactly.
    const lp = [lowpass(500, SR)]
    expect(magnitude(lp, 2000, SR)).toBeCloseTo(0.056449, 6)
    expect(magnitude(lp, 4000, SR)).toBeCloseTo(0.0097, 6)
  })
})

describe('filtfilt', () => {
  const ramp = (n: number, f: (i: number) => number) => Float64Array.from({ length: n }, (_, i) => f(i))

  it('leaves no phase shift: a symmetric input stays symmetric', () => {
    const n = 2001
    const x = ramp(n, (i) => Math.exp(-(((i - 1000) / 60) ** 2)))
    const y = filtfilt([lowpass(300, SR)], x)
    for (let k = 1; k <= 400; k++) {
      expect(y[1000 - k]).toBeCloseTo(y[1000 + k], 9)
    }
  })

  it('keeps a constant constant, rather than ramping up from zero', () => {
    const x = ramp(4000, () => 0.7)
    const y = filtfilt([lowpass(150, SR)], x)
    expect(y[0]).toBeCloseTo(0.7, 6)
    expect(y[2000]).toBeCloseTo(0.7, 9)
    expect(y[3999]).toBeCloseTo(0.7, 6)
  })

  it('passes a tone inside the band and removes one outside it', () => {
    const tone = (hz: number) => ramp(8000, (i) => Math.sin((2 * Math.PI * hz * i) / SR))
    const band = [highpass(60, SR), lowpass(2000, SR)]
    const rms = (a: Float64Array) => Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length)

    // filtfilt runs the cascade twice, so the gain applies squared.
    expect(rms(filtfilt(band, tone(500)))).toBeCloseTo(Math.SQRT1_2, 2)
    expect(rms(filtfilt(band, tone(7000)))).toBeLessThan(rms(filtfilt(band, tone(500))) / 20)
  })

  it('refuses a clip shorter than its own padding', () => {
    expect(() => filtfilt([lowpass(150, SR)], new Float64Array(5))).toThrow(RangeError)
  })
})
