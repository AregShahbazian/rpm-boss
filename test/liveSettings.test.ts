import {afterEach, describe, expect, it} from 'vitest'
import {DEFAULT_MOTION, readMaxRpm, readMotion, readRedline} from '../src/ui/liveSettings'

/** The tests run under `environment: 'node'`, so storage is stubbed. */
function stubStorage(entries?: Record<string, string>) {
  const store = new Map(Object.entries(entries ?? {}))
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    },
  })
}

function stubThrowingStorage() {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('blocked')
    },
  })
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'localStorage')
})

describe('the live preference', () => {
  it('is smooth when nothing is stored', () => {
    stubStorage()
    expect(readMotion()).toBe('smooth')
    expect(DEFAULT_MOTION).toBe('smooth')
  })

  it('returns what was stored', () => {
    stubStorage({'rpm-boss.live.motion': 'step'})
    expect(readMotion()).toBe('step')
  })

  it('ignores a value that is not one of the choices', () => {
    stubStorage({'rpm-boss.live.motion': 'sideways'})
    expect(readMotion()).toBe('smooth')
  })

  it('survives storage that throws on access', () => {
    stubThrowingStorage()
    expect(readMotion()).toBe('smooth')
  })

  it('survives no storage at all', () => {
    expect(readMotion()).toBe('smooth')
  })
})

describe('the dial the rider asks for', () => {
  it('is 0-12,000 with a redline at 9,000 when nothing is stored', () => {
    stubStorage()
    expect(readMaxRpm()).toBe(12_000)
    expect(readRedline(readMaxRpm())).toBe(9_000)
  })

  it('returns what was stored', () => {
    stubStorage({'rpm-boss.dial.maxRpm': '10000', 'rpm-boss.dial.redline': '7500'})
    expect(readMaxRpm()).toBe(10_000)
    expect(readRedline(10_000)).toBe(7_500)
  })

  it('holds a stored face inside its bounds rather than drawing it', () => {
    stubStorage({'rpm-boss.dial.maxRpm': '3000'})
    expect(readMaxRpm()).toBe(9_000)
    stubStorage({'rpm-boss.dial.maxRpm': '30000'})
    expect(readMaxRpm()).toBe(12_000)
  })

  it('brings a redline down with the dial it was drawn on', () => {
    // Stored legitimately at 9,000, then the dial was shrunk under it.
    stubStorage({'rpm-boss.dial.maxRpm': '9000', 'rpm-boss.dial.redline': '11000'})
    expect(readRedline(readMaxRpm())).toBe(9_000)
  })

  it.each(['loud', '', '   '])('ignores %o, which is not a number', (stored) => {
    // The empty string matters: `Number('')` is 0, which is finite, and would
    // clamp to the smallest dial rather than falling back to the default.
    stubStorage({'rpm-boss.dial.maxRpm': stored})
    expect(readMaxRpm()).toBe(12_000)
  })

  it('survives storage that throws on access', () => {
    stubThrowingStorage()
    expect(readMaxRpm()).toBe(12_000)
    expect(readRedline(12_000)).toBe(9_000)
  })
})
