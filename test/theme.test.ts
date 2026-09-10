import { afterEach, describe, expect, it } from 'vitest'
import { applyTheme, DEFAULT_THEME, readTheme, THEMES, type Theme } from '../src/ui/theme'

/** The tests run under `environment: 'node'`, so both sides are stubbed. */
function stubStorage(value?: string) {
  const store = new Map<string, string>()
  if (value !== undefined) store.set('rpm-boss.theme', value)
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    },
  })
}

const fakeRoot = () => ({ dataset: {} as Record<string, string>, style: {} as { colorScheme?: string } })

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'localStorage')
})

describe('readTheme', () => {
  it('is dark when nothing is stored', () => {
    stubStorage()
    expect(readTheme()).toBe('dark')
    expect(DEFAULT_THEME).toBe('dark')
  })

  it('is dark when storage is unavailable at all', () => {
    // No stub: touching `localStorage` throws, as it does in a private window.
    expect(readTheme()).toBe('dark')
  })

  it('takes any of the three stored values', () => {
    for (const theme of THEMES) {
      stubStorage(theme)
      expect(readTheme()).toBe(theme)
    }
  })

  it('ignores a stored value that is not a theme', () => {
    stubStorage('sepia')
    expect(readTheme()).toBe('dark')
  })
})

describe('applyTheme', () => {
  it('stamps every choice, `system` included, so the stylesheet can scope its query', () => {
    for (const theme of THEMES) {
      const root = fakeRoot()
      applyTheme(theme as Theme, root as unknown as HTMLElement)
      expect(root.dataset.theme).toBe(theme)
    }
  })

  it('hands the same choice to the native controls', () => {
    const light = fakeRoot()
    applyTheme('light', light as unknown as HTMLElement)
    expect(light.style.colorScheme).toBe('light')

    const system = fakeRoot()
    applyTheme('system', system as unknown as HTMLElement)
    expect(system.style.colorScheme).toBe('light dark')
  })
})
