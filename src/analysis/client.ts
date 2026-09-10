/**
 * Main-thread side of the analysis worker.
 *
 * One worker is kept for the life of the screen rather than spawned per press:
 * starting one costs more than the analysis itself.
 *
 * Every request settles. A worker that never answers — one that failed to
 * load, or a browser that will not take a module worker — would otherwise
 * leave the screen stuck on "Analysing…" with the controls disabled until a
 * reload, so failures resolve as an `AnalysisFailure` rather than hanging or
 * rejecting.
 */
import type { AudioClip } from '../audio/types'
import { failure, type Analysis, type ExpectedRange } from '../dsp/types'
import type { AnalyseRequest, AnalyseResponse } from './protocol'

export interface AnalysisClient {
  run(clip: AudioClip, range?: ExpectedRange): Promise<Analysis>
  dispose(): void
}

export function createAnalysisClient(): AnalysisClient {
  const pending = new Map<number, (result: Analysis) => void>()
  let nextId = 1
  let worker: Worker | undefined

  const settleAll = (result: Analysis) => {
    const waiting = [...pending.values()]
    pending.clear()
    for (const resolve of waiting) resolve(result)
  }

  try {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
  } catch {
    worker = undefined
  }

  if (worker) {
    worker.onmessage = (event: MessageEvent<AnalyseResponse>) => {
      const resolve = pending.get(event.data.id)
      pending.delete(event.data.id)
      resolve?.(event.data.result)
    }
    // Either the worker failed to start, or it threw before posting back.
    // Neither leaves anything worth waiting for.
    worker.onerror = () => settleAll(failure('worker-failed'))
    worker.onmessageerror = () => settleAll(failure('worker-failed'))
  }

  return {
    run(clip, range) {
      const target = worker
      if (!target) return Promise.resolve(failure('worker-failed'))

      const id = nextId++
      // The samples are structured-cloned rather than transferred: the window
      // clip can be the loaded clip itself, and handing its buffer away would
      // empty the waveform behind the user. A copy of at most 640 kB, once per
      // press, is not worth the risk.
      const request: AnalyseRequest = { id, samples: clip.samples, sampleRate: clip.sampleRate, range }
      return new Promise<Analysis>((resolve) => {
        pending.set(id, resolve)
        try {
          target.postMessage(request)
        } catch {
          pending.delete(id)
          resolve(failure('worker-failed'))
        }
      })
    },
    dispose() {
      settleAll(failure('worker-failed'))
      worker?.terminate()
      worker = undefined
    },
  }
}
