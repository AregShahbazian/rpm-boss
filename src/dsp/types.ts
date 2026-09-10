/** What the analysis produces, and the constants that shape it. */

/**
 * Revolutions per combustion. Two for the 4-stroke single the MVP targets; a
 * 2-stroke would be one. Named rather than inlined so the deferred preset can
 * set it without touching the DSP (see backlog).
 */
export const REVS_PER_PULSE = 2

/**
 * Shortest clip the analysis will accept, in seconds. Measured, not chosen:
 * below 2 s one fixture falls outside its tolerance at some window positions.
 * See `scripts/reference/sweep.py` and the phase 4 design.
 */
export const MIN_ANALYSIS_S: number = 2

/**
 * Least peak-above-trough contrast that counts as an engine. Fixtures score
 * 0.55 and up in their worst window; noise, near-silence and speech-like audio
 * stay below 0.33.
 */
export const MIN_CONFIDENCE = 0.45

export type AnalysisErrorCode = 'too-short' | 'no-signal' | 'worker-failed'

export const ANALYSIS_ERROR_MESSAGES: Record<AnalysisErrorCode, string> = {
  'too-short': `Choose at least ${MIN_ANALYSIS_S} seconds.`,
  'no-signal': 'No steady engine sound here. Try another part.',
  'worker-failed': 'Analysis could not start. Reload the page.',
}

export interface ExpectedRange {
  minRpm: number
  maxRpm: number
}

export interface AnalysisResult {
  ok: true
  rpm: number
  /** Autocorrelation estimate, the primary one. */
  pulsesPerS: number
  /** Peak-count estimate, the cross-check. */
  peakPulsesPerS: number
  confidence: number
  /** Combustion positions in seconds from the start of the window; phase 5 draws these. */
  pulseTimesS: number[]
  /** True when the expected range moved the answer to another octave. */
  octaveAdjusted: boolean
}

export interface AnalysisFailure {
  ok: false
  code: AnalysisErrorCode
  message: string
}

export type Analysis = AnalysisResult | AnalysisFailure

export const failure = (code: AnalysisErrorCode): AnalysisFailure => ({
  ok: false,
  code,
  message: ANALYSIS_ERROR_MESSAGES[code],
})
