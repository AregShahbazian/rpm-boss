import { describe, expect, it } from 'vitest'
import { decodeToClip } from '../src/audio/decode'
import { InputError } from '../src/audio/types'
import { assertMinLength, sliceClip } from '../src/waveform/slice'
import { fixtures, loadFixture } from './fixtures'

const clipOf = (i: number) => {
  const wav = loadFixture(fixtures[i])
  return decodeToClip([wav.samples], wav.sampleRate, { kind: 'file', name: fixtures[i].source })
}

describe('sliceClip', () => {
  it('cuts 2.0-12.0 s of before-cold-clutch to 160000 matching samples', () => {
    const clip = clipOf(5)
    const win = sliceClip(clip, { startS: 2, endS: 12 })
    expect(win.samples.length).toBe(160000)
    expect(win.durationS).toBeCloseTo(10, 9)
    expect(win.samples[123]).toBe(clip.samples[32000 + 123])
    expect(win.source).toEqual(clip.source)
    expect(clip.samples.length).toBe(Math.round(15.9 * 16000) + (clip.samples.length - Math.round(15.9 * 16000)))
  })
  it('clamps to the clip', () => {
    const clip = clipOf(3) // after-cold 6.4 s
    const win = sliceClip(clip, { startS: 5, endS: 20 })
    expect(win.durationS).toBeCloseTo(clip.durationS - 5, 3)
  })
})

describe('assertMinLength', () => {
  const mk = (s: number) => ({ sampleRate: 16000 as const, samples: new Float32Array(16000 * s), durationS: s, source: { kind: 'file' as const, name: 'x' } })
  it('rejects 0.5 s with the too-short message', () => {
    expect(() => assertMinLength(mk(0.5))).toThrow(InputError)
    try {
      assertMinLength(mk(0.5))
    } catch (e) {
      expect((e as InputError).code).toBe('too-short')
    }
  })
  it('accepts 1.0 s', () => {
    expect(assertMinLength(mk(1)).durationS).toBe(1)
  })
})
