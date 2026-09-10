import { describe, expect, it } from 'vitest'
import { fixtures, loadFixture } from './fixtures'

describe('fixtures', () => {
  it.each(fixtures)('$file decodes to 16 kHz mono of the documented length', (f) => {
    const wav = loadFixture(f)
    expect(wav.sampleRate).toBe(16000)
    expect(wav.samples.length / wav.sampleRate).toBeCloseTo(f.durationS, 0)
    const peak = wav.samples.reduce((m, s) => Math.max(m, Math.abs(s)), 0)
    expect(peak).toBeGreaterThan(0.05)
  })
})
