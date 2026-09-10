/** The languages the app speaks, and how they are listed. */

export interface Language {
  /** BCP 47 code, and the file name in this directory. */
  code: string
  /** The language's own name, in its own script. The only label in the picker. */
  name: string
  /** Written right to left. Only Urdu, and nothing reads this yet; see phase 8. */
  rtl?: true
}

/**
 * Listed by their own names, with no flags. A flag is a country and a language
 * is not: Spanish, Portuguese and French would each show a country that is not
 * the market, Swahili has no country at all, and Filipino and Cebuano would
 * share one. A name in its own script is also the one label a speaker
 * recognises without first reading the interface language.
 *
 * Names follow what Android's own settings show, so they are labels users have
 * seen before.
 */
export const LANGUAGES: readonly Language[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'pt', name: 'Português' },
  { code: 'id', name: 'Indonesia' },
  { code: 'ms', name: 'Melayu' },
  { code: 'fil', name: 'Filipino' },
  { code: 'ceb', name: 'Cebuano' },
  { code: 'sw', name: 'Kiswahili' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'th', name: 'ไทย' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'ur', name: 'اردو', rtl: true },
  { code: 'ru', name: 'Русский' },
  { code: 'uk', name: 'Українська' },
  { code: 'hy', name: 'Հայերեն' },
]

/**
 * Sorted by the written name, so Latin names run A to Z and each other script
 * forms its own block. A Thai speaker finds ไทย by spotting Thai script, not by
 * knowing where T falls in English. This is what Android's picker does.
 */
export function sortedLanguages(): Language[] {
  const collator = new Intl.Collator()
  return [...LANGUAGES].sort((a, b) => collator.compare(a.name, b.name))
}

/** Android reports Tagalog; our file is Filipino. */
const ALIASES: Record<string, string> = { tl: 'fil' }

const KNOWN = new Set(LANGUAGES.map((l) => l.code))

/**
 * The first of the device's languages the app can speak, else English.
 * An exact match wins over a base tag, so `pt-BR` finds `pt` and `zh-TW`
 * finds nothing.
 */
export function detectLanguage(preferred: readonly string[]): string {
  for (const tag of preferred) {
    const lower = tag.toLowerCase()
    const exact = ALIASES[lower] ?? lower
    if (KNOWN.has(exact)) return exact
    const base = lower.split('-')[0]
    const aliased = ALIASES[base] ?? base
    if (KNOWN.has(aliased)) return aliased
  }
  return 'en'
}
