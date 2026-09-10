import { createContext, createElement, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { en, type MessageKey, type Messages } from './en'
import { detectLanguage, LANGUAGES } from './languages'

export { LANGUAGES, sortedLanguages, type Language } from './languages'
export type { MessageKey } from './en'

/** Values a message can be given. Numbers are formatted by the caller. */
export type Args = Record<string, string | number>

const BUNDLES: Record<string, () => Promise<{ messages: Messages }>> = Object.fromEntries(
  // Translations live in their own directory so this pattern matches only
  // them; a `./${code}.ts` here would sweep up the layer's own modules.
  LANGUAGES.filter((l) => l.code !== 'en').map((l) => [l.code, () => import(`./messages/${l.code}.ts`)]),
)

const STORAGE_KEY = 'rpm-boss.language'

/** Storage can throw in a private window, and a preference is not worth an error. */
function readStored(): string | undefined {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? undefined
  } catch {
    return undefined
  }
}

function writeStored(code: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    // no persistence available; the choice still holds for this session
  }
}

/** A stored choice beats the device, which beats English. */
export function initialLanguage(): string {
  const stored = readStored()
  if (stored && LANGUAGES.some((l) => l.code === stored)) return stored
  const preferred = typeof navigator === 'undefined' ? [] : (navigator.languages ?? [navigator.language])
  return detectLanguage(preferred.filter(Boolean))
}

/** `{name}` becomes the matching argument. Anything unmatched is left alone. */
export function format(template: string, args?: Args): string {
  if (!args) return template
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in args ? String(args[key]) : whole))
}

/**
 * A number and its unit, formatted together. This is what keeps plural rules
 * out of the app: Russian has three forms, Thai has none, and neither is
 * something the messages should have to know.
 */
export function duration(seconds: number, lang: string): string {
  return new Intl.NumberFormat(lang, { style: 'unit', unit: 'second', unitDisplay: 'long' }).format(seconds)
}

interface I18n {
  lang: string
  setLang: (code: string) => void
  t: (key: MessageKey, args?: Args) => string
}

const Context = createContext<I18n | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState(initialLanguage)
  const [messages, setMessages] = useState<Messages>(en)

  const setLang = useCallback((code: string) => {
    setLangState(code)
    writeStored(code)
    if (code === 'en') {
      setMessages(en)
      return
    }
    // Bundles load on demand: seventeen languages in the first payload would
    // cost every user sixteen they cannot read.
    void BUNDLES[code]?.()
      .then((mod) => setMessages(mod.messages))
      .catch(() => setMessages(en))
  }, [])

  // The first language is applied once, on mount, through the same path.
  const [loaded, setLoaded] = useState(false)
  if (!loaded) {
    setLoaded(true)
    if (lang !== 'en') setLang(lang)
  }

  const value = useMemo<I18n>(
    () => ({
      lang,
      setLang,
      // A missing key falls back to English. The test suite fails the build if
      // any language is short one, so this should never fire.
      t: (key, args) => format(messages[key] ?? en[key], args),
    }),
    [lang, setLang, messages],
  )

  return createElement(Context.Provider, { value }, children)
}

export function useI18n(): I18n {
  const value = useContext(Context)
  if (!value) throw new Error('useI18n used outside I18nProvider')
  return value
}
