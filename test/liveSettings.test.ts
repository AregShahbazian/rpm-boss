import {afterEach, describe, expect, it} from 'vitest'
import {DEFAULT_MOTION, readMotion} from '../src/ui/liveSettings'

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
