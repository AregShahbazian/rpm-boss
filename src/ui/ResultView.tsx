import { useEffect, useRef } from 'react'
import { MIN_ANALYSIS_S } from '../dsp/types'
import type { AnalysisState } from '../state/useAnalysis'
import { duration, useI18n } from '../i18n'
import { ANALYSIS_ERROR_KEYS } from './errorKeys'
import { octaveKey } from './octave'

interface Props {
  analysis: AnalysisState
}

/**
 * The answer.
 *
 * The evidence for it used to live here too, as a second waveform. It now lives
 * on the crop canvas, which zooms to the analysed window when a result arrives;
 * see `WaveformBlock`. What is left is the figure, its unit, how many
 * combustions were counted, and the note that says the expected range moved it.
 */
export function ResultView({ analysis }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const { t, n, lang } = useI18n()
  const settled = analysis.status === 'done' || analysis.status === 'failed'

  useEffect(() => {
    // `nearest` so a screen tall enough to show everything does not move.
    if (settled) box.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [settled])

  if (analysis.status === 'running') return <p className="status muted">{t('analysing')}</p>
  if (analysis.status === 'failed') {
    return (
      <div className="result" ref={box}>
        <p className="status error">
          {analysis.error
            ? t(ANALYSIS_ERROR_KEYS[analysis.error], { duration: duration(MIN_ANALYSIS_S, lang) })
            : t('errorWorkerFailed')}
        </p>
      </div>
    )
  }
  if (analysis.status !== 'done' || !analysis.result) return <div className="result" ref={box} />

  const { rpm, pulsesPerS, pulseTimesS, octaveAdjusted } = analysis.result

  return (
    <div className="result" ref={box}>
      <p className="rpm mono" data-testid="result" dir="ltr">
        <span className="rpm-value">{Math.round(rpm)}</span>
        <span className="rpm-unit">{t('rpm')}</span>
      </p>
      <p className="readout muted" data-testid="result-caption">
        {t('marked', { count: n(pulseTimesS.length) })}
        {octaveAdjusted ? ` · ${t(octaveKey(rpm, pulsesPerS))}` : ''}
      </p>
    </div>
  )
}
