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
 * `SAMPLES_ENABLED` is deliberately not one of these. It is decided by the
 * build rather than by an edit, so it lives with the samples it gates.
 */
export interface Features {
  /**
   * The pair of RPM fields under the waveform. The analysis takes the range as
   * a hint and works without one, so the section can go and leave a working
   * app — which is the question the flag exists to answer.
   */
  expectedRange: boolean
  /**
   * The Mock button beside Start, which drives live mode from a bundled
   * recording instead of the microphone, and the performance readout under the
   * scope. A developer's affordance: live mode is otherwise only testable next
   * to a running engine. Off in anything that ships, and dead anyway in a
   * build without the samples it plays.
   */
  mockLive: boolean
}

export const FEATURES: Features = {
  expectedRange: false,
  mockLive: false,
}
