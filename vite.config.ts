import { createReadStream, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vitest/config'

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
  // On for the dev server, off for a build, and `VITE_SAMPLES` overrides either
  // way: `VITE_SAMPLES=1 npm run build` ships them, `VITE_SAMPLES=0 npm run dev`
  // hides them.
  const flag = process.env.VITE_SAMPLES
  const enabled = flag === '1' || (flag !== '0' && command === 'serve')
  return {
    base: './',
    plugins: [react(), samples(enabled, command === 'build')],
    define: { __SAMPLES__: JSON.stringify(enabled) },
    test: { environment: 'node', include: ['test/**/*.test.ts', 'src/**/*.test.ts'] },
  }
})
