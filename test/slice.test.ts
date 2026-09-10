import { describe, expect, it } from 'vitest'
import { assertMinLength, decodeToClip, sliceClip, trimClip } from '../src/audio/decode'
import { InputError, MIN_CLIP_S } from '../src/audio/types'
import { fixtures, loadFixture } from './fixtures'

const clipOf = (i: number) => {
  const wav = loadFixture(fixtures[i])
  return decodeToClip([wav.samples], wav.sampleRate, { kind: 'file', name: fixtures[i].source })
}

const mk = (s: number) => ({
  sampleRate: 16000 as const,
  samples: new Float32Array(Math.round(16000 * s)),
  durationS: s,
  source: { kind: 'file' as const, name: 'x' },
})

describe('sliceClip', () => {
  it('cuts 2.0-12.0 s of before-cold-clutch to 160000 matching samples', () => {
    const clip = clipOf(5)
    const win = sliceClip(clip, 2, 12)
    expect(win.samples.length).toBe(160000)
    expect(win.durationS).toBeCloseTo(10, 9)
    expect(win.samples[123]).toBe(clip.samples[32000 + 123])
    expect(win.source).toEqual(clip.source)
  })

  it('keeps the sample count identical while a window of one length is moved', () => {
    const clip = clipOf(5)
    const len = 7.0666666
    const counts = new Set<number>()
    for (let start = 0; start < 8; start += 0.0137) counts.add(sliceClip(clip, start, start + len).samples.length)
    expect(counts.size).toBe(1)
  })

  it('clamps to the clip', () => {
    const clip = clipOf(3) // after-cold, 6.4 s
    expect(sliceClip(clip, 5, 20).durationS).toBeCloseTo(clip.durationS - 5, 3)
    expect(sliceClip(clip, 100, 110).samples.length).toBe(0)
  })
})

describe('trimClip', () => {
  it('is a slice from the start and leaves short clips untouched', () => {
    const clip = mk(15)
    expect(trimClip(clip, 10).samples.length).toBe(160000)
    const short = mk(4)
    expect(trimClip(short, 10)).toBe(short)
  })
})

describe('assertMinLength', () => {
  it('rejects 0.5 s with the too-short code', () => {
    expect(() => assertMinLength(mk(0.5))).toThrow(InputError)
    try {
      assertMinLength(mk(0.5))
    } catch (e) {
      expect((e as InputError).code).toBe('too-short')
    }
  })
  it('rejects anything under the minimum and accepts the minimum itself', () => {
    expect(() => assertMinLength(mk(MIN_CLIP_S - 0.1))).toThrow(InputError)
    expect(assertMinLength(mk(MIN_CLIP_S)).durationS).toBe(MIN_CLIP_S)
  })

  it('carries the code rather than a sentence, so the screen can translate it', () => {
    // Asserted on the throw itself: inside a bare catch, a version that stops
    // throwing would run no assertions and pass.
    expect(() => assertMinLength(mk(MIN_CLIP_S - 0.1))).toThrow('too-short')
  })
})
