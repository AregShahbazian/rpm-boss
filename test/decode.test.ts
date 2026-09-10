import { describe, expect, it } from 'vitest'
import { decodeToClip, trimClip } from '../src/audio/decode'
import { fixtures, loadFixture } from './fixtures'

describe('decodeToClip', () => {
  it.each(fixtures)('$file round-trips at 16 kHz with the documented duration', (f) => {
    const wav = loadFixture(f)
    const clip = decodeToClip([wav.samples], wav.sampleRate, { kind: 'file', name: f.source })
    expect(clip.sampleRate).toBe(16000)
    expect(clip.durationS).toBeCloseTo(f.durationS, 0)
    expect(clip.samples.length).toBe(wav.samples.length)
    expect(clip.samples[1000]).toBeCloseTo(wav.samples[1000], 6)
    expect(clip.source.name).toBe(f.source)
  })

  it('trimClip caps the duration and leaves short clips alone', () => {
    const wav = loadFixture(fixtures[5]) // before-cold-clutch, 15.9 s
    const clip = decodeToClip([wav.samples], 16000, { kind: 'file', name: 'x' })
    const trimmed = trimClip(clip, 10)
    expect(trimmed.durationS).toBeCloseTo(10, 5)
    expect(trimmed.samples.length).toBe(160000)
    expect(trimClip(trimmed, 10)).toBe(trimmed)
  })
})
