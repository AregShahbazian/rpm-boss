import { describe, expect, it } from 'vitest'
import { encodeWav, parseWav } from '../src/dsp/wav'

describe('encodeWav', () => {
  it('round-trips through parseWav', () => {
    const original = Float32Array.from({ length: 500 }, (_, i) => Math.sin(i / 7) * 0.8)
    const got = parseWav(encodeWav(original, 16000))

    expect(got.sampleRate).toBe(16000)
    expect(got.samples.length).toBe(original.length)
    for (let i = 0; i < original.length; i++) expect(got.samples[i]).toBeCloseTo(original[i], 4)
  })

  it('clamps past full scale instead of wrapping', () => {
    const got = parseWav(encodeWav(Float32Array.from([2, -2, 0]), 16000))
    expect(got.samples[0]).toBeCloseTo(1, 4)
    expect(got.samples[1]).toBeCloseTo(-1, 4)
    expect(got.samples[2]).toBe(0)
  })

  it('writes a header a decoder recognises', () => {
    const bytes = new Uint8Array(encodeWav(new Float32Array(10), 16000))
    const text = String.fromCharCode(...bytes.slice(0, 4)) + String.fromCharCode(...bytes.slice(8, 12))
    expect(text).toBe('RIFFWAVE')
    expect(bytes.length).toBe(44 + 20)
  })
})
