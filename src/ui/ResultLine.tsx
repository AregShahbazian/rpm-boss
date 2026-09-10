import type { AnalysisState } from '../state/useAnalysis'

/**
 * Deliberately plain. Phase 5 owns the result view; this is only enough to see
 * that the number came out and to check it against the test suite.
 */
export function ResultLine({ analysis }: { analysis: AnalysisState }) {
  if (analysis.status === 'running') return <p className="status muted">Analysing…</p>
  if (analysis.status === 'failed') return <p className="status error">{analysis.error}</p>
  if (analysis.status !== 'done' || !analysis.result) return <p className="status" />

  const { rpm, pulsesPerS, octaveAdjusted } = analysis.result
  return (
    <p className="status mono" data-testid="result">
      {Math.round(rpm)} rpm
      <span className="muted"> · {pulsesPerS.toFixed(2)} combustions/s{octaveAdjusted ? ' · range applied' : ''}</span>
    </p>
  )
}
