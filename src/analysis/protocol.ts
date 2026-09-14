/** The messages that cross the worker boundary. */
import type {Analysis, ExpectedRange, RevsPerPulse} from '../dsp/types'

export interface AnalyseRequest {
  id: number
  samples: Float32Array
  sampleRate: number
  range?: ExpectedRange
  /** Which engine is being listened to; omitted means the four-stroke default. */
  revsPerPulse?: RevsPerPulse
}

export interface AnalyseResponse {
  id: number
  result: Analysis
}
