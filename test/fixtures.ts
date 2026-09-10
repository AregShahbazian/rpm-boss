import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseWav, type WavData } from '../src/dsp/wav'
import expected from './fixtures/expected.json'

export interface Fixture {
  file: string
  source: string
  durationS: number
  expectedRpm: number
  toleranceRpm: number
}

export const fixtures: Fixture[] = expected.fixtures
export const engine = expected.engine

export function loadFixture(f: Fixture): WavData {
  const buf = readFileSync(join(__dirname, 'fixtures', f.file))
  return parseWav(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
}
