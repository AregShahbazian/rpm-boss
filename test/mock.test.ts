import {describe, expect, it} from 'vitest'
import {chunksOwed, readLooped} from '../src/live/mock'

const CHUNK = 2048
const SR = 16000

describe('chunksOwed', () => {
  it('owes nothing before a chunk has elapsed', () => {
    expect(chunksOwed(100, 0)).toBe(0)
  })

  it('owes one second of audio per second of wall time', () => {
    // 16000 samples is 7.8 chunks, so seven whole ones are due.
    expect(chunksOwed(1000, 0)).toBe(Math.floor(SR / CHUNK))
  })

  it('counts from what has already been sent, not from zero', () => {
    expect(chunksOwed(1000, 5)).toBe(Math.floor(SR / CHUNK) - 5)
  })

  it('never asks for audio back when the clock has been beaten', () => {
    expect(chunksOwed(100, 50)).toBe(0)
  })

  it('does not drift: ten seconds owes ten times one second', () => {
    expect(chunksOwed(10_000, 0)).toBe(Math.floor((10 * SR) / CHUNK))
  })
})

describe('readLooped', () => {
  const slice = Float32Array.from({length: 10}, (_, i) => i + 1)

  it('reads forward and returns where it stopped', () => {
    const out = new Float32Array(4)
    expect(readLooped(slice, 0, out)).toBe(4)
    expect([...out]).toEqual([1, 2, 3, 4])
  })

  it('joins the end of the loop to its start with no gap', () => {
    const out = new Float32Array(4)
    expect(readLooped(slice, 8, out)).toBe(2)
    expect([...out]).toEqual([9, 10, 1, 2])
  })

  it('wraps more than once when the read is longer than the loop', () => {
    const out = new Float32Array(12)
    readLooped(slice, 0, out)
    expect([...out]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2])
  })

  it('emits every sample exactly once per lap', () => {
    const out = new Float32Array(10)
    let at = 0
    const seen: number[] = []
    for (let i = 0; i < 5; i++) {
      at = readLooped(slice, at, new Float32Array(2))
      seen.push(at)
    }
    void out
    expect(seen).toEqual([2, 4, 6, 8, 0])
  })
})
