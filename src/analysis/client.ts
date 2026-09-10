/**
 * Main-thread side of the analysis worker.
 *
 * One worker is kept for the life of the screen rather than spawned per press:
 * starting one costs more than the analysis itself.
 */
import type { AudioClip } from '../audio/types'
import type { Analysis, ExpectedRange } from '../dsp/types'
import type { AnalyseRequest, AnalyseResponse } from './protocol'

export interface AnalysisClient {
  run(clip: AudioClip, range?: ExpectedRange): Promise<Analysis>
  dispose(): void
}

export function createAnalysisClient(): AnalysisClient {
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
  const pending = new Map<number, (result: Analysis) => void>()
  let nextId = 1

  worker.onmessage = (event: MessageEvent<AnalyseResponse>) => {
    const resolve = pending.get(event.data.id)
    pending.delete(event.data.id)
    resolve?.(event.data.result)
  }

  return {
    run(clip, range) {
      const id = nextId++
      // The samples are structured-cloned rather than transferred: the window
      // clip can be the loaded clip itself, and handing its buffer away would
      // empty the waveform behind the user. A copy of at most 640 kB, once per
      // press, is not worth the risk.
      const request: AnalyseRequest = { id, samples: clip.samples, sampleRate: clip.sampleRate, range }
      return new Promise<Analysis>((resolve) => {
        pending.set(id, resolve)
        worker.postMessage(request)
      })
    },
    dispose() {
      pending.clear()
      worker.terminate()
    },
  }
}
