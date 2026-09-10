import { describe, expect, it } from 'vitest'
import { envelope } from '../src/dsp/envelope'

const SR = 16000

/** Short bursts of 400 Hz tone at `rate` per second, the shape of an exhaust note. */
function pulseTrain(durationS: number, rate: number, sampleRate = SR): Float32Array {
  const n = Math.round(durationS * sampleRate)
  const period = sampleRate / rate
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const phase = (i % period) / period
    const burst = Math.exp(-phase * 25)
    out[i] = burst * Math.sin((2 * Math.PI * 400 * i) / sampleRate)
  }
  return out
}

function peakIndices(env: Float64Array, minSpacing: number): number[] {
  const threshold = env.reduce((s, v) => s + v, 0) / env.length
  const out: number[] = []
  for (let i = 1; i < env.length - 1; i++) {
    if (env[i] <= env[i - 1] || env[i] < env[i + 1] || env[i] < threshold) continue
    if (out.length && i - out[out.length - 1] < minSpacing) continue
    out.push(i)
  }
  return out
}

describe('envelope', () => {
  it('peaks once per pulse, at the pulse', () => {
    const rate = 15
    const env = envelope(pulseTrain(4, rate), SR)
    const peaks = peakIndices(env, (0.6 * SR) / rate)

    expect(peaks.length).toBeGreaterThanOrEqual(58)
    expect(peaks.length).toBeLessThanOrEqual(61)
    // Each peak sits within 3 ms of a pulse start, so markers land on the sound.
    for (const p of peaks) {
      const offset = p % (SR / rate)
      expect(Math.min(offset, SR / rate - offset)).toBeLessThan(0.003 * SR)
    }
  })

  it('is non-negative everywhere', () => {
    const env = envelope(pulseTrain(2, 20), SR)
    expect(Math.min(...env)).toBeGreaterThanOrEqual(0)
  })

  it('is zero-phase: a symmetric burst gives a symmetric envelope', () => {
    const n = 8001
    const mid = 4000
    const x = Float32Array.from({ length: n }, (_, i) =>
      Math.exp(-(((i - mid) / 300) ** 2)) * Math.sin((2 * Math.PI * 500 * i) / SR),
    )
    const env = envelope(x, SR)
    for (let k = 1; k <= 1500; k += 25) expect(env[mid - k]).toBeCloseTo(env[mid + k], 6)
  })

  it('drops a tone above the band', () => {
    const n = SR * 2
    const inBand = Float32Array.from({ length: n }, (_, i) => Math.sin((2 * Math.PI * 500 * i) / SR))
    const above = Float32Array.from({ length: n }, (_, i) => Math.sin((2 * Math.PI * 7000 * i) / SR))
    const mean = (a: Float64Array) => a.reduce((s, v) => s + v, 0) / a.length

    expect(mean(envelope(above, SR))).toBeLessThan(mean(envelope(inBand, SR)) / 20)
  })
})
