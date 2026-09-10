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

export const INPUT_ERROR_MESSAGES: Record<InputErrorCode, string> = {
  'too-large': 'Too big. Use a recording under 50 MB.',
  undecodable: 'Cannot open that file. Use WAV, MP3, AAC/M4A or OGG.',
  'mic-denied': 'Microphone blocked. Allow it, then try again.',
  'no-mic': 'No microphone on this device.',
  'insecure-origin': 'The microphone needs a secure address (https).',
  'too-short': `Record at least ${MIN_CLIP_S} ${MIN_CLIP_S === 1 ? 'second' : 'seconds'}.`,
  'no-audio': 'Nothing was recorded. Close other apps using the microphone.',
  'record-failed': 'Recording failed. Try again.',
  'capture-blocked': 'This browser cannot record engine sound. Use Chrome, or open a file.',
}

export class InputError extends Error {
  readonly code: InputErrorCode
  constructor(code: InputErrorCode, cause?: unknown) {
    super(INPUT_ERROR_MESSAGES[code], cause === undefined ? undefined : { cause })
    this.name = 'InputError'
    this.code = code
  }
}

export const MAX_RECORD_S = 10
