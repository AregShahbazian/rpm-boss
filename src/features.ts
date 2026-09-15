/**
 * Features that can be switched off without taking the code out.
 *
 * A flag here is a way to see the app without a part of it — to judge whether
 * a section earns its space, or to hide something half-finished — not a
 * permanent configuration surface. Nothing reads these at runtime and nothing
 * writes them: they are edited here, in the source, and the build that results
 * is the build that ships.
 *
 * They are typed `boolean` rather than left to infer `true`, so that a flag
 * still reads as a question with two answers and the compiler does not start
 * calling the other branch dead code.
 *
 * `SAMPLES_ENABLED` and `MOCK_ENABLED` are deliberately not among these. Both
 * are decided by the build rather than by an edit, so each lives with the thing
 * it gates. That is the difference: a flag here is wanted in a working copy for
 * an afternoon and in no build at all; a flag there is wanted in one build and
 * not in another, and must not depend on anybody remembering to switch it back.
 */
export interface Features {
  /**
   * The pair of RPM fields under the waveform. The analysis takes the range as
   * a hint and works without one, so the section can go and leave a working
   * app — which is the question the flag exists to answer.
   */
  expectedRange: boolean
  /**
   * The performance readout under the scope: runs, milliseconds, skipped ticks,
   * capture ratio. It answers one question — whether the phone keeps up with an
   * analysis every 200 ms — and it is a question asked while working on the
   * loop, not while using the app. It shared a flag with the Mock button until
   * the button became a build's decision (`MOCK_ENABLED`); the readout stays
   * here, because no build wants it.
   */
  liveStats: boolean
}

export const FEATURES: Features = {
  expectedRange: false,
  liveStats: false,
}
