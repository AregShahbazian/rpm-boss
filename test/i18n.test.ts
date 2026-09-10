import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { en } from '../src/i18n/en'
import { detectLanguage, LANGUAGES, sortedLanguages } from '../src/i18n/languages'
import { duration, format } from '../src/i18n'

const codes = LANGUAGES.map((l) => l.code).filter((c) => c !== 'en')
const bundles = await Promise.all(
  codes.map(async (code) => [code, (await import(`../src/i18n/messages/${code}.ts`)).messages] as const),
)

const keys = Object.keys(en) as (keyof typeof en)[]
/** Words that are the same in several languages, or are deliberately not translated. */
const SHARED = new Set(['rpm', 'analysing', 'record', 'calculate', 'play', 'min', 'max'])

describe('every language', () => {
  it.each(bundles)('%s has exactly the keys English has', (_code, messages) => {
    expect(Object.keys(messages).sort()).toEqual(keys.slice().sort())
  })

  it.each(bundles)('%s keeps every placeholder English uses', (_code, messages) => {
    const slots = (s: string) => (s.match(/\{(\w+)\}/g) ?? []).sort()
    for (const key of keys) expect(slots(messages[key])).toEqual(slots(en[key]))
  })

  it.each(bundles)('%s is not just English pasted in', (_code, messages) => {
    const copied = keys.filter((k) => messages[k] === en[k] && !SHARED.has(String(en[k]).toLowerCase()))
    expect(copied).toEqual([])
  })

  it.each(bundles)('%s leaves the unit alone', (_code, messages) => {
    expect(messages.rpm).toBe('rpm')
  })
})

describe('the picker', () => {
  it('lists every language once, by its own name', () => {
    const names = LANGUAGES.map((l) => l.name)
    expect(new Set(names).size).toBe(names.length)
    expect(LANGUAGES.find((l) => l.code === 'th')?.name).toBe('ไทย')
  })

  it('sorts Latin names alphabetically and groups other scripts', () => {
    const order = sortedLanguages().map((l) => l.code)
    expect(order.indexOf('en')).toBeLessThan(order.indexOf('es'))
    expect(order.indexOf('es')).toBeLessThan(order.indexOf('fr'))
    // Non-Latin scripts land after the Latin block rather than interleaved.
    expect(order.indexOf('fr')).toBeLessThan(order.indexOf('ru'))
    expect(order.indexOf('ru')).toBeLessThan(order.indexOf('th'))
  })

  it('marks only Urdu as right-to-left', () => {
    expect(LANGUAGES.filter((l) => l.rtl).map((l) => l.code)).toEqual(['ur'])
  })
})

describe('detectLanguage', () => {
  it('takes an exact match', () => {
    expect(detectLanguage(['vi'])).toBe('vi')
  })

  it('falls back to the base tag', () => {
    expect(detectLanguage(['pt-BR'])).toBe('pt')
    expect(detectLanguage(['es-CO'])).toBe('es')
  })

  it('maps Tagalog to Filipino, which is what the file is called', () => {
    expect(detectLanguage(['tl'])).toBe('fil')
    expect(detectLanguage(['tl-PH'])).toBe('fil')
  })

  it('takes the first language it knows, not the first listed', () => {
    expect(detectLanguage(['zh-TW', 'ja', 'th'])).toBe('th')
  })

  it('falls back to English', () => {
    expect(detectLanguage(['zh-TW'])).toBe('en')
    expect(detectLanguage([])).toBe('en')
  })
})

describe('format', () => {
  it('fills a slot', () => {
    expect(format('Record at least {duration}.', { duration: '2 seconds' })).toBe('Record at least 2 seconds.')
  })

  it('leaves an unmatched slot alone rather than printing undefined', () => {
    expect(format('Loaded: {name} · {duration}', { name: 'a.wav' })).toBe('Loaded: a.wav · {duration}')
  })

  it('does nothing without arguments', () => {
    expect(format('Calculate')).toBe('Calculate')
  })
})

describe('duration', () => {
  // The point of formatting the number and its unit together: Russian has
  // three plural forms, Thai has none, and neither is the app's problem.
  it.each([
    ['en', 1, 'second'],
    ['en', 2, 'seconds'],
    ['ru', 1, 'секунда'],
    ['ru', 2, 'секунды'],
    ['ru', 5, 'секунд'],
  ])('%s at %i reads with the right form', (lang, n, word) => {
    expect(duration(n, lang)).toContain(word)
  })

  it.each(['id', 'th', 'vi', 'hi'])('%s formats without throwing', (lang) => {
    expect(duration(2, lang)).toMatch(/2/)
  })
})

describe('no bare strings left', () => {
  // AC 1. This is the test that stops the layer rotting the first time someone
  // is in a hurry.
  const roots = ['src/ui', 'src/audio', 'src/dsp']
  const skip = /MicCheck|ExportButton/
  const files = roots.flatMap((dir) =>
    readdirSync(dir)
      .filter((f) => (f.endsWith('.tsx') || f.endsWith('.ts')) && !skip.test(f))
      .map((f) => join(dir, f)),
  )

  it.each(files)('%s holds no user-facing sentence', (file) => {
    const source = readFileSync(file, 'utf8')
    // A sentence: a capitalised run of words ending in a full stop, inside
    // quotes. Enough to catch a message put back by hand.
    const sentences = source.match(/['"`][A-Z][a-z]+ [^'"`]{10,}[.?!]['"`]/g) ?? []
    const real = sentences.filter((s) => !/Error|error\(|Cannot access|must be|not supported/.test(s))
    expect(real).toEqual([])
  })
})
