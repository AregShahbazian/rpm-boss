import { describe, expect, it } from 'vitest'
import { analyse } from '../src/dsp/analyse'
import { fixtures, loadFixture } from './fixtures'
import reference from './fixtures/reference.json'

/**
 * The gate for the whole phase. `expected.json` says what the engine was
 * doing; `reference.json` says what the scipy baseline in
 * `scripts/reference/analyse.py` computed, which is what catches a port that
 * is subtly wrong but still plausible.
 */
describe('analysis over the fixtures', () => {
  const analysed = fixtures.map((f) => {
    const wav = loadFixture(f)
    return {
      fixture: f,
      // The real length, not the rounded one in expected.json.
      durationS: wav.samples.length / wav.sampleRate,
      result: analyse(wav.samples, wav.sampleRate),
    }
  })

  it.each(analysed)('$fixture.file reads an rpm inside its tolerance', ({ fixture, result }) => {
    if (!result.ok) throw new Error(result.message)
    expect(Math.abs(result.rpm - fixture.expectedRpm)).toBeLessThanOrEqual(fixture.toleranceRpm)
  })

  it.each(analysed)('$fixture.file has both estimators agreeing within 3 %', ({ result }) => {
    if (!result.ok) throw new Error(result.message)
    const spread = Math.abs(result.pulsesPerS - result.peakPulsesPerS) / result.pulsesPerS
    expect(spread).toBeLessThan(0.03)
  })

  // The baseline runs the same three sections in the same order, so the two
  // should agree to rounding. Observed spread is 0.0004 %, and reference.json
  // is stored to four decimals; 0.01 % leaves a wide margin and still catches
  // any real drift in a filter stage, which a loose tolerance would hide.
  const BASELINE_TOLERANCE = 0.0001

  it.each(analysed)('$fixture.file matches the scipy baseline', ({ fixture, result }) => {
    if (!result.ok) throw new Error(result.message)
    const want = reference.fixtures[fixture.file as keyof typeof reference.fixtures]

    expect(Math.abs(result.pulsesPerS - want.pulsesPerS) / want.pulsesPerS).toBeLessThan(BASELINE_TOLERANCE)
    expect(Math.abs(result.peakPulsesPerS - want.peakPulsesPerS) / want.peakPulsesPerS).toBeLessThan(BASELINE_TOLERANCE)
  })

  it.each(analysed)('$fixture.file is read with confidence', ({ result }) => {
    if (!result.ok) throw new Error(result.message)
    expect(result.confidence).toBeGreaterThan(0.5)
  })

  // The result view draws one mark per entry, so this is also the check that
  // the marks a user counts match the rate they are shown (phase 5, AC 1).
  it.each(analysed)('$fixture.file marks a combustion per pulse', ({ fixture, result }) => {
    if (!result.ok) throw new Error(result.message)
    const expectedCount = result.pulsesPerS * fixture.durationS
    expect(result.pulseTimesS.length).toBeGreaterThan(expectedCount * 0.95)
    expect(result.pulseTimesS.length).toBeLessThan(expectedCount * 1.05)
  })

  it.each(analysed)('$fixture.file marks are ordered and inside the window', ({ durationS, result }) => {
    if (!result.ok) throw new Error(result.message)
    for (let i = 1; i < result.pulseTimesS.length; i++) {
      expect(result.pulseTimesS[i]).toBeGreaterThan(result.pulseTimesS[i - 1])
    }
    expect(result.pulseTimesS[0]).toBeGreaterThanOrEqual(0)
    expect(result.pulseTimesS[result.pulseTimesS.length - 1]).toBeLessThanOrEqual(durationS)
  })
})
