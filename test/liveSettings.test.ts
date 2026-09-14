import {afterEach, describe, expect, it} from 'vitest'
import {
  DEFAULT_FALLBACK,
  DEFAULT_MOTION,
  readFallback,
  readMotion,
} from '../src/ui/liveSettings'

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

describe('the live preferences', () => {
  it('fall back to zero and smooth when nothing is stored', () => {
    stubStorage()
    expect(readFallback()).toBe('zero')
    expect(readMotion()).toBe('smooth')
    expect(DEFAULT_FALLBACK).toBe('zero')
    expect(DEFAULT_MOTION).toBe('smooth')
  })

  it('return what was stored', () => {
    stubStorage({'rpm-boss.live.fallback': 'hold', 'rpm-boss.live.motion': 'step'})
    expect(readFallback()).toBe('hold')
    expect(readMotion()).toBe('step')
  })

  it('ignore a value that is not one of the choices', () => {
    stubStorage({'rpm-boss.live.fallback': 'sideways', 'rpm-boss.live.motion': ''})
    expect(readFallback()).toBe('zero')
    expect(readMotion()).toBe('smooth')
  })

  it('survive storage that throws on access', () => {
    stubThrowingStorage()
    expect(readFallback()).toBe('zero')
    expect(readMotion()).toBe('smooth')
  })

  it('survive no storage at all', () => {
    expect(readFallback()).toBe('zero')
    expect(readMotion()).toBe('smooth')
  })
})
