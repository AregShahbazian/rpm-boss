import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { SPLIT, TALL } from '../src/ui/breakpoints'

/**
 * The variants live in CSS and the same queries are interpolated into the
 * layout's `css` block from TypeScript. Nothing in either language can see the
 * other, so this is what keeps them equal.
 */
const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')

const declared = (name: string) => {
  // `@custom-variant <name> (@media <query>);` — the query itself contains
  // brackets, so take everything between the first `@media` and the final `)`.
  const found = css.match(new RegExp(`@custom-variant ${name} \\(@media (.*)\\);`))
  return found?.[1].trim()
}

describe('named breakpoints', () => {
  it('split matches the variant in index.css', () => {
    expect(declared('split')).toBe(SPLIT)
  })

  it('tall matches the variant in index.css', () => {
    expect(declared('tall')).toBe(TALL)
  })
})
