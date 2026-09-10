import { useEffect, useRef } from 'react'
import type { AudioClip } from '../audio/types'
import type { AnalysisState } from '../state/useAnalysis'
import { octaveNote } from './octave'
import { ResultWaveform } from './ResultWaveform'

interface Props {
  analysis: AnalysisState
  /** The window that was analysed, for drawing the marks against. */
  clip?: AudioClip
}

/**
 * The answer: one figure, and the evidence for it.
 *
 * The marked waveform is not decoration. This method fails by a factor of two
 * when it fails at all, and a comb of marks that skips every other beat, or
 * doubles up on each one, is obvious to a person and invisible in a number.
 */
export function ResultView({ analysis, clip }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const settled = analysis.status === 'done' || analysis.status === 'failed'

  useEffect(() => {
    // `nearest` so a screen tall enough to show everything does not move.
    if (settled) box.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [settled])

  if (analysis.status === 'running') return <p className="status muted">Analysing…</p>
  if (analysis.status === 'failed') {
    return (
      <div className="result" ref={box}>
        <p className="status error">{analysis.error}</p>
      </div>
    )
  }
  if (analysis.status !== 'done' || !analysis.result) return <div className="result" ref={box} />

  const { rpm, pulsesPerS, pulseTimesS, octaveAdjusted } = analysis.result

  return (
    <div className="result" ref={box}>
      <p className="rpm mono" data-testid="result">
        <span className="rpm-value">{Math.round(rpm)}</span>
        <span className="rpm-unit">rpm</span>
      </p>
      {clip && <ResultWaveform clip={clip} pulseTimesS={pulseTimesS} />}
      <p className="readout muted" data-testid="result-caption">
        {pulseTimesS.length} marked{octaveAdjusted ? ` · ${octaveNote(rpm, pulsesPerS)}` : ''}
      </p>
    </div>
  )
}
