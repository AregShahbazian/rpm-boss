import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import expected from './fixtures/expected.json'
import { SAMPLES, sampleFile, sampleUrl } from '../src/samples'

const AUDIO_DIR = 'audio'

describe('the bundled samples', () => {
  it.each(SAMPLES)('sample $n has a file to load', (sample) => {
    expect(existsSync(join(AUDIO_DIR, sampleFile(sample.n)))).toBe(true)
  })

  it('lists every sample file there is', () => {
    const onDisk = readdirSync(AUDIO_DIR)
      .filter((f) => /^sample-\d+\.m4a$/.test(f))
      .sort()
    expect(SAMPLES.map((s) => sampleFile(s.n)).sort()).toEqual(onDisk)
  })

  // The number shown beside each clip is the reference count, so it has to
  // stay the number the fixtures were measured against.
  it.each(SAMPLES)('sample $n quotes the rpm the fixtures were measured at', (sample) => {
    const fixture = expected.fixtures.find((f) => f.source === sampleFile(sample.n))
    expect(fixture?.expectedRpm).toBe(sample.rpm)
  })

  it('addresses the audio relative to the page, not the server root', () => {
    expect(sampleUrl(1)).toMatch(/samples\/sample-1\.m4a$/)
  })
})
