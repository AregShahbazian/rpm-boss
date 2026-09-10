import { describe, expect, it } from 'vitest'
import { pcm16ToFloat } from '../src/audio/native'

describe('pcm16ToFloat', () => {
  const le = (...values: number[]) => {
    const bytes = new Uint8Array(values.length * 2)
    const view = new DataView(bytes.buffer)
    values.forEach((v, i) => view.setInt16(i * 2, v, true))
    return bytes
  }

  it('reads little-endian samples into the -1..1 range', () => {
    const got = pcm16ToFloat(le(0, 16384, -16384, 32767, -32768))
    expect(got[0]).toBe(0)
    expect(got[1]).toBeCloseTo(0.5, 5)
    expect(got[2]).toBeCloseTo(-0.5, 5)
    expect(got[3]).toBeCloseTo(1, 4)
    expect(got[4]).toBe(-1)
  })

  it('ignores a trailing odd byte rather than reading past the end', () => {
    const bytes = new Uint8Array([0x00, 0x40, 0x7f])
    expect(pcm16ToFloat(bytes).length).toBe(1)
  })

  it('returns nothing for an empty take', () => {
    expect(pcm16ToFloat(new Uint8Array(0)).length).toBe(0)
  })

  it('reads a view that does not start at the buffer origin', () => {
    // Base64 decoding can hand back an offset view; a naive DataView would
    // read from the wrong place.
    const backing = le(0, 8192, 16384)
    const offset = new Uint8Array(backing.buffer, 2, 4)
    const got = pcm16ToFloat(offset)
    expect(got.length).toBe(2)
    expect(got[0]).toBeCloseTo(0.25, 5)
    expect(got[1]).toBeCloseTo(0.5, 5)
  })
})
