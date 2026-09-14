import {describe, expect, it} from 'vitest'
import {Ring} from '../src/live/ring'

const fill = (from: number, count: number) => Float32Array.from({length: count}, (_, i) => from + i)

describe('Ring', () => {
  it('is not full until it has been filled once', () => {
    const ring = new Ring(4)
    expect(ring.full).toBe(false)
    ring.push(fill(1, 3))
    expect(ring.full).toBe(false)
    ring.push(fill(4, 1))
    expect(ring.full).toBe(true)
  })

  it('hands back the window oldest first, across the wrap', () => {
    const ring = new Ring(4)
    ring.push(fill(1, 6))
    // 5 and 6 overwrote 1 and 2; what is left, in order, is 3 4 5 6.
    expect([...ring.snapshot()]).toEqual([3, 4, 5, 6])
  })

  it('keeps only the tail of a chunk longer than itself', () => {
    const ring = new Ring(3)
    ring.push(fill(1, 10))
    expect([...ring.snapshot()]).toEqual([8, 9, 10])
  })

  it('writes the newest samples into a shorter buffer', () => {
    const ring = new Ring(6)
    ring.push(fill(1, 8))
    const out = new Float32Array(3)
    ring.latest(out)
    expect([...out]).toEqual([6, 7, 8])
  })

  it('writes the newest samples when the tail crosses the wrap', () => {
    const ring = new Ring(4)
    ring.push(fill(1, 5))
    const out = new Float32Array(4)
    ring.latest(out)
    expect([...out]).toEqual([2, 3, 4, 5])
  })

  it('reuses one buffer, so a snapshot must be consumed before the next', () => {
    const ring = new Ring(4)
    ring.push(fill(1, 4))
    const first = ring.snapshot()
    ring.push(fill(5, 4))
    const second = ring.snapshot()
    expect(first).toBe(second)
  })
})
