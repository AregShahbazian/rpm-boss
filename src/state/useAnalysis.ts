import { useCallback, useEffect, useRef, useState } from 'react'
import { createAnalysisClient, type AnalysisClient } from '../analysis/client'
import type { AudioClip } from '../audio/types'
import type { AnalysisResult, ExpectedRange } from '../dsp/types'

export type AnalysisStatus = 'idle' | 'running' | 'done' | 'failed'

export interface AnalysisState {
  status: AnalysisStatus
  result?: AnalysisResult
  error?: string
}

const IDLE: AnalysisState = { status: 'idle' }

/**
 * One analysis run at a time, cleared whenever the thing being analysed
 * changes. `resetKey` is whatever identifies the window: change it and any
 * number on screen goes away, so a result is never shown under a selection it
 * did not come from.
 */
export function useAnalysis(resetKey: unknown) {
  const [state, setState] = useState<AnalysisState>(IDLE)
  const [seen, setSeen] = useState(resetKey)
  const client = useRef<AnalysisClient>(undefined)
  const currentKey = useRef(resetKey)
  const runToken = useRef(0)

  // Adjusted during render rather than in an effect, the same shape phase 3
  // used in WaveformBlock: one commit, and no frame showing a stale number.
  if (seen !== resetKey) {
    setSeen(resetKey)
    setState(IDLE)
  }

  useEffect(() => {
    currentKey.current = resetKey
  }, [resetKey])

  useEffect(() => {
    return () => {
      client.current?.dispose()
      client.current = undefined
    }
  }, [])

  const analyse = useCallback(async (clip: AudioClip, key: unknown, range?: ExpectedRange) => {
    client.current ??= createAnalysisClient()
    const token = ++runToken.current
    setState({ status: 'running' })

    const result = await client.current.run(clip, range)
    // Drop the answer if another run started, or if the window moved under it.
    if (token !== runToken.current || key !== currentKey.current) return

    setState(result.ok ? { status: 'done', result } : { status: 'failed', error: result.message })
  }, [])

  return { analysis: state, analyse }
}
