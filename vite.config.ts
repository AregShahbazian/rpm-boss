import { createReadStream, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import tailwind from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vitest/config'
import { iconBundle } from './scripts/icon-bundle.ts'

const AUDIO_DIR = 'audio'
const SAMPLE_FILE = /^sample-\d+\.m4a$/

/**
 * Serves `audio/sample-N.m4a` at `/samples/sample-N.m4a` in dev, and copies the
 * same files into the build. Both only when the samples are turned on, so a
 * normal release carries no audio it never plays.
 */
function samples(enabled: boolean, building: boolean): Plugin {
  return {
    name: 'rpm-boss-samples',
    configureServer(server) {
      if (!enabled) return
      server.middlewares.use('/samples', (req, res, next) => {
        const name = (req.url ?? '').replace(/^\//, '')
        if (!SAMPLE_FILE.test(name)) return next()
        res.setHeader('Content-Type', 'audio/mp4')
        createReadStream(join(AUDIO_DIR, name)).on('error', next).pipe(res)
      })
    },
    buildStart() {
      if (!enabled || !building) return
      for (const name of readdirSync(AUDIO_DIR).filter((f) => SAMPLE_FILE.test(f))) {
        this.emitFile({ type: 'asset', fileName: `samples/${name}`, source: readFileSync(join(AUDIO_DIR, name)) })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  /*
   * The two demo affordances: the bundled engine recordings, and the simulated
   * engine behind the Mock button. Independent of each other, and off unless
   * asked for — in every mode, the dev server included.
   *
   * The dev server used to have them on by default, on the grounds that a desk
   * has no motorcycle at it. That made `npm run dev` a different app from the
   * one that ships, which is the wrong thing for the command a change is judged
   * in. One rule now: what you get is the release unless you say otherwise.
   * `./scripts/dev.sh --demo` is how you say it locally, and
   * `.github/workflows/deploy.yml` is how the website does.
   */
  const enabled = process.env.VITE_SAMPLES === '1'
  const mockEnabled = process.env.VITE_MOCK === '1'
  return {
    base: './',
    // `jsxImportSource` is what gives every element the `css` prop. It is a
    // compiler setting, not a runtime one: Emotion's JSX factory replaces
    // React's, and nothing has to be imported per file except the `css` tag
    // itself. No Babel — see the styling design note.
    plugins: [
      react({ jsxImportSource: '@emotion/react' }),
      tailwind(),
      samples(enabled, command === 'build'),
      iconBundle(),
    ],
    define: { __SAMPLES__: JSON.stringify(enabled), __MOCK__: JSON.stringify(mockEnabled) },
    test: { environment: 'node', include: ['test/**/*.test.ts', 'src/**/*.test.ts'] },
  }
})
