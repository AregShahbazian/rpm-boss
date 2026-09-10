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

export type InputErrorCode = 'too-large' | 'undecodable' | 'mic-denied' | 'no-mic' | 'no-audio' | 'record-failed'

export const INPUT_ERROR_MESSAGES: Record<InputErrorCode, string> = {
  'too-large': 'That file is over 50 MB. Pick a shorter recording.',
  undecodable: "Couldn't read that file. Use WAV, MP3, AAC/M4A or OGG.",
  'mic-denied': 'Microphone access was denied. Allow it in the browser and try again.',
  'no-mic': 'No microphone found on this device.',
  'no-audio': 'No audio was captured. Check that no other app is using the microphone and try again.',
  'record-failed': 'Recording failed. Try again.',
}

export class InputError extends Error {
  readonly code: InputErrorCode
  constructor(code: InputErrorCode, cause?: unknown) {
    super(INPUT_ERROR_MESSAGES[code], cause === undefined ? undefined : { cause })
    this.name = 'InputError'
    this.code = code
  }
}

export const MAX_FILE_BYTES = 50 * 1024 * 1024
export const MAX_RECORD_S = 10
