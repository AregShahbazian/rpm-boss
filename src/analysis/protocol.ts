/** The messages that cross the worker boundary. */
import type { Analysis, ExpectedRange } from '../dsp/types'

export interface AnalyseRequest {
  id: number
  samples: Float32Array
  sampleRate: number
  range?: ExpectedRange
}

export interface AnalyseResponse {
  id: number
  result: Analysis
}
