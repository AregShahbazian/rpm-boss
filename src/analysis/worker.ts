/// <reference lib="webworker" />
/**
 * Runs the analysis off the main thread. A ten-second window is a few hundred
 * thousand butterflies plus three filter passes, which is enough to drop
 * frames if it ran where the UI lives.
 */
import { analyse } from '../dsp/analyse'
import type { AnalyseRequest, AnalyseResponse } from './protocol'

self.onmessage = (event: MessageEvent<AnalyseRequest>) => {
  const { id, samples, sampleRate, range } = event.data
  const response: AnalyseResponse = { id, result: analyse(samples, sampleRate, range) }
  self.postMessage(response)
}
