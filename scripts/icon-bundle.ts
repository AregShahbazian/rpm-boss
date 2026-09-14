import { readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { extname, join } from 'node:path'
import type { IconifyJSON } from '@iconify/types'
import { getIconData, iconToSVG } from '@iconify/utils'
import type { Plugin } from 'vite'

/**
 * Bundles the icons the source actually names, and nothing else.
 *
 * `<Icon icon="mdi:play"/>` is a string, so nothing static can tree-shake it
 * and the runtime would otherwise fetch the drawing from Iconify's API on
 * first render. That is a network round trip on the web and simply a blank
 * square inside the APK. So the names are read out of the source at build
 * time and their paths are compiled in: the same bytes ship to both targets
 * and neither one talks to a server.
 *
 * Each name is resolved all the way to what an `<svg>` needs — the path data
 * and the viewBox — so `Icon` is a plain element with no loading state and no
 * icon library behind it at runtime. Aliases and the rotations some of them
 * carry are baked in here, where they cost nothing.
 */

/** What the component needs from an icon, and all it needs. */
export interface BundledIcon {
  body: string
  viewBox: string
}

/** `prefix:name` — the only string shape Iconify accepts, and what we grep for. */
const ICON_NAME = /['"`]([a-z0-9]+(?:-[a-z0-9]+)*:[a-z0-9]+(?:-[a-z0-9]+)*)['"`]/g

/**
 * Comments, taken out before the grep runs.
 *
 * The prose around an icon component names icons — `mdi:play` in a doc comment
 * reads as documentation, not as a request to ship that drawing — and backticks
 * are quotes as far as the grep is concerned. The line rule spares a `//` that
 * follows a colon, so a URL inside a string does not swallow the rest of it.
 */
const BLOCK_COMMENT = /\/\*[\s\S]*?\*\//g
const LINE_COMMENT = /(^|[^:])\/\/.*$/gm

const SRC = 'src'
const SOURCE_FILE = new Set(['.ts', '.tsx'])

export const VIRTUAL_ID = 'virtual:icons'
const RESOLVED_ID = `\0${VIRTUAL_ID}`

const require_ = createRequire(import.meta.url)

/** The sets installed as `@iconify-json/*`, loaded once and kept. */
function installedSets(): Map<string, IconifyJSON> {
  const sets = new Map<string, IconifyJSON>()
  let names: string[]
  try {
    names = readdirSync('node_modules/@iconify-json')
  } catch {
    return sets
  }
  for (const prefix of names) {
    try {
      sets.set(prefix, require_(`@iconify-json/${prefix}/icons.json`) as IconifyJSON)
    } catch {
      // A directory that is not a set package. Not ours to complain about.
    }
  }
  return sets
}

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) sourceFiles(path, out)
    else if (SOURCE_FILE.has(extname(entry.name))) out.push(path)
  }
  return out
}

/**
 * Every `prefix:name` literal under `src`, resolved against the installed sets.
 *
 * The grep is deliberately blind to context: it takes any string literal of the
 * right shape, wherever it sits, so an icon named in a lookup table or picked
 * by a ternary is found as readily as one written into the prop. The filter is
 * the set list, not the syntax — an unknown prefix is some other colon-shaped
 * string and is dropped in silence, while a known prefix with a name the set
 * does not have is a typo, and says so.
 */
function collect(warn: (message: string) => void): Record<string, BundledIcon> {
  const sets = installedSets()
  const bundle: Record<string, BundledIcon> = {}
  for (const file of sourceFiles(SRC)) {
    const source = readFileSync(file, 'utf8').replace(BLOCK_COMMENT, '').replace(LINE_COMMENT, '$1')
    for (const [, name] of source.matchAll(ICON_NAME)) {
      if (name in bundle) continue
      const [prefix, icon] = name.split(':')
      const set = sets.get(prefix)
      if (!set) continue
      const data = getIconData(set, icon)
      if (!data) {
        warn(`${file}: "${name}" is not an icon in the ${prefix} set`)
        continue
      }
      const { attributes, body } = iconToSVG(data, { height: 'auto' })
      bundle[name] = { body, viewBox: attributes.viewBox }
    }
  }
  return bundle
}

export function iconBundle(): Plugin {
  let last = ''
  return {
    name: 'rpm-boss-icon-bundle',
    resolveId: (id) => (id === VIRTUAL_ID ? RESOLVED_ID : undefined),
    load(id) {
      if (id !== RESOLVED_ID) return
      const bundle = collect((message) => this.warn(message))
      last = JSON.stringify(bundle)
      return `export default ${last}`
    },
    // In dev a newly typed name has to reach the bundle, but re-reading every
    // file on every keystroke would reload the page for edits that named no
    // icon. Comparing the result to the last one keeps the reload for the edits
    // that changed it.
    handleHotUpdate({ file, server }) {
      if (!SOURCE_FILE.has(extname(file))) return
      if (JSON.stringify(collect(() => {})) === last) return
      const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
      if (mod) server.moduleGraph.invalidateModule(mod)
      server.hot.send({ type: 'full-reload' })
    },
  }
}
