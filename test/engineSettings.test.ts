import {afterEach, describe, expect, it} from 'vitest'
import {DEFAULT_STROKE, readStroke} from '../src/ui/engineSettings'

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

describe('the engine preference', () => {
  it('is four-stroke when nothing is stored', () => {
    stubStorage()
    expect(readStroke()).toBe('4')
    expect(DEFAULT_STROKE).toBe('4')
  })

  it('returns what was stored', () => {
    stubStorage({'rpm-boss.engine.stroke': '2'})
    expect(readStroke()).toBe('2')
  })

  it('ignores a value that is not one of the choices', () => {
    stubStorage({'rpm-boss.engine.stroke': '3'})
    expect(readStroke()).toBe('4')
  })

  it('survives storage that throws on access', () => {
    stubThrowingStorage()
    expect(readStroke()).toBe('4')
  })

  it('survives no storage at all', () => {
    expect(readStroke()).toBe('4')
  })
})
