import { MIN_ANALYSIS_S } from '../dsp/types'

/** The one input shape every later feature consumes. Fixed 16 kHz mono. */
export const SAMPLE_RATE = 16000 as const

export interface AudioSource {
  kind: 'file' | 'mic'
  name: string
}

export interface AudioClip {
  sampleRate: typeof SAMPLE_RATE
  /** Mono samples in -1..1. */
  samples: Float32Array
  durationS: number
  source: AudioSource
}

export type InputErrorCode =
  | 'too-large'
  | 'undecodable'
  | 'mic-denied'
  | 'no-mic'
  | 'no-audio'
  | 'too-short'
  | 'insecure-origin'
  | 'record-failed'
  | 'capture-blocked'

export const MAX_FILE_BYTES = 50 * 1024 * 1024
/**
 * Clips shorter than this are rejected at load, and it is also the smallest
 * crop window. The two stay equal on purpose: a clip that cannot fill the
 * smallest window can never be analysed, so refusing it at load beats
 * accepting it and failing at Calculate. The value is the analysis module's,
 * measured against the fixtures.
 */
export const MIN_CLIP_S = MIN_ANALYSIS_S

/**
 * The error carries a code, not a sentence. The wording lives in the
 * translation files and is chosen at the edge, in the component that displays
 * it, because nothing down here knows what language the user reads. The
 * message is the code, which is what a developer wants in a stack trace
 * anyway.
 */
export class InputError extends Error {
  readonly code: InputErrorCode
  constructor(code: InputErrorCode, cause?: unknown) {
    super(code, cause === undefined ? undefined : { cause })
    this.name = 'InputError'
    this.code = code
  }
}

export const MAX_RECORD_S = 10
