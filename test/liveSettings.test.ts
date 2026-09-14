import {afterEach, describe, expect, it} from 'vitest'
import {
  DEFAULT_MOTION,
  readMaxRpm,
  readMotion,
  readRedline,
  resetTachoSettings,
  tachoIsDefault,
} from '../src/ui/liveSettings'

/** The tests run under `environment: 'node'`, so storage is stubbed. */
function stubStorage(entries?: Record<string, string>) {
  const store = new Map(Object.entries(entries ?? {}))
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
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

describe('resetting the tachometer settings', () => {
  const STORED = {
    'rpm-boss.live.motion': 'step',
    'rpm-boss.dial.maxRpm': '9500',
    'rpm-boss.dial.redline': '7000',
  }

  it('puts all three back to what the app shipped with', () => {
    stubStorage({...STORED})
    resetTachoSettings()

    expect(readMotion()).toBe(DEFAULT_MOTION)
    expect(readMaxRpm()).toBe(12_000)
    expect(readRedline(readMaxRpm())).toBe(9_000)
  })

  it("leaves the settings that are not the tachometer's alone", () => {
    stubStorage({...STORED, 'rpm-boss.theme': 'light', 'rpm-boss.engine.stroke': '2', 'rpm-boss.language': 'fil'})
    resetTachoSettings()

    expect(localStorage.getItem('rpm-boss.theme')).toBe('light')
    expect(localStorage.getItem('rpm-boss.engine.stroke')).toBe('2')
    expect(localStorage.getItem('rpm-boss.language')).toBe('fil')
  })

  it('forgets the keys rather than storing the defaults into them', () => {
    // A stored default is frozen: it would not follow the app if a later
    // version decided the dial should start somewhere else.
    stubStorage({...STORED})
    resetTachoSettings()
    expect(localStorage.getItem('rpm-boss.dial.maxRpm')).toBeNull()
  })

  it('survives storage that throws, and storage that is not there', () => {
    stubThrowingStorage()
    expect(() => resetTachoSettings()).not.toThrow()
    Reflect.deleteProperty(globalThis, 'localStorage')
    expect(() => resetTachoSettings()).not.toThrow()
  })
})

describe('whether the tachometer settings are the defaults', () => {
  it('is true only for all three at once', () => {
    expect(tachoIsDefault('smooth', 12_000, 9_000)).toBe(true)
    expect(tachoIsDefault('step', 12_000, 9_000)).toBe(false)
    expect(tachoIsDefault('smooth', 9_500, 9_000)).toBe(false)
    expect(tachoIsDefault('smooth', 12_000, 7_000)).toBe(false)
  })

  it('is false for any dial but the default one, whatever the redline', () => {
    // The redline's own default follows the dial — on a 9,000 face it is
    // 9,000 — but a 9,000 face is itself a choice, so there is something to
    // reset either way.
    expect(tachoIsDefault('smooth', 9_000, 9_000)).toBe(false)
    expect(tachoIsDefault('smooth', 9_000, 8_000)).toBe(false)
  })
})
