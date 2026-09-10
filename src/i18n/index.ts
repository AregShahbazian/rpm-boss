import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
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

/**
 * Bidi isolates, wrapped around every interpolated value in a right-to-left
 * language.
 *
 * An Urdu sentence with a Latin file name in it — "Loaded: {name}" — is two
 * directions in one line, and the bidi algorithm will otherwise reorder the
 * run's trailing punctuation and digits into the wrong place, and truncate it
 * from the wrong end. Isolating the value says "whatever is in here has its
 * own direction", which is exactly true of a file name, a duration or a count.
 */
const FSI = '\u2068'
const PDI = '\u2069'

function isolate(args?: Args): Args | undefined {
  if (!args) return args
  return Object.fromEntries(Object.entries(args).map(([key, value]) => [key, `${FSI}${value}${PDI}`]))
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
  /** Whole numbers inside messages, in the reader's digits. */
  n: (value: number) => string
}

const Context = createContext<I18n | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState(initialLanguage)
  const [messages, setMessages] = useState<Messages>(en)
  /**
   * Which load is current. A user who picks Russian and then Thai on a slow
   * connection would otherwise get whichever chunk happens to land last, and
   * could end up reading Russian under a `lang` of Thai.
   */
  const request = useRef(0)

  const apply = useCallback((code: string) => {
    const token = ++request.current
    setLangState(code)
    if (code === 'en') {
      setMessages(en)
      return
    }
    // Bundles load on demand: seventeen languages in the first payload would
    // cost every user sixteen they cannot read.
    void BUNDLES[code]?.()
      .then((mod) => {
        if (token === request.current) setMessages(mod.messages)
      })
      .catch(() => {
        // The chunk did not arrive: offline, or a stale hash after a deploy.
        // Fall back to English *and say so in `lang`*, otherwise the picker
        // still shows the failed language, selecting it again fires no change
        // event, and there is no way to retry.
        if (token !== request.current) return
        setMessages(en)
        setLangState('en')
      })
  }, [])

  /** The picker. A deliberate choice, unlike a detected one, is remembered. */
  const setLang = useCallback(
    (code: string) => {
      writeStored(code)
      apply(code)
    },
    [apply],
  )

  // The first language is applied once, on mount, and deliberately *not*
  // stored: a language merely detected from the device is not a choice, and
  // storing it would freeze the app on whatever the phone said the first time
  // it was opened.
  //
  // In an effect rather than during render, because the chunk loads
  // asynchronously either way; there is nothing to gain from starting it a
  // paint earlier, and reading the request token during render is a lie about
  // when the work happens.
  useEffect(() => {
    if (lang !== 'en') apply(lang)
    // Mount only: later changes come through setLang.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rtl = LANGUAGES.find((l) => l.code === lang)?.rtl === true

  // Screen readers and the browser's own font and line-breaking rules both go
  // by this. Without it a Thai or Armenian screen is read by an English voice.
  //
  // `dir` is what turns the whole layout around for Urdu. The grid columns,
  // the logical margins and the text alignment all follow it, so this one line
  // is the entire right-to-left implementation outside the stylesheet.
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = rtl ? 'rtl' : 'ltr'
  }, [lang, rtl])

  const value = useMemo<I18n>(
    () => ({
      lang,
      setLang,
      // A missing key falls back to English. The test suite fails the build if
      // any language is short one, so this should never fire.
      t: (key, args) => format(messages[key] ?? en[key], rtl ? isolate(args) : args),
      // Counts inside sentences follow the reader's digits, the way the
      // durations already do. The rpm figure deliberately does not: it is a
      // gauge reading, and a rider comparing it against a manual should see
      // the same shape everywhere.
      n: (value) => new Intl.NumberFormat(lang).format(value),
    }),
    [lang, setLang, messages, rtl],
  )

  return createElement(Context.Provider, { value }, children)
}

export function useI18n(): I18n {
  const value = useContext(Context)
  if (!value) throw new Error('useI18n used outside I18nProvider')
  return value
}
