import { useEffect, useRef } from 'react'
import { MIN_ANALYSIS_S } from '../dsp/types'
import type { AnalysisState } from '../state/useAnalysis'
import { duration, useI18n } from '../i18n'
import { ANALYSIS_ERROR_KEYS } from './errorKeys'
import { octaveKey } from './octave'
import { StatusText } from './kit'
import { css } from '@emotion/react'

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
/**
 * The box the answer sits in, in all three of its states. `empty:hidden` is
 * what keeps the layout from reserving a gap before there is anything to show.
 */
/*
 * The split gap is 8 px, and the range panel's is likewise tighter — which the
 * old stylesheet asked for and never got: plain `.result` and `.range` rules
 * sat after the split block at equal specificity and won, so both overrides
 * were dead. The refactor reproduced the dead behaviour first so the frame diff
 * stayed clean; applying the evident intent was a separate, deliberate change.
 */
function Box({ ref, children }: { ref: React.RefObject<HTMLDivElement | null>; children?: React.ReactNode }) {
  return (
    <div ref={ref} className="flex flex-col gap-3 empty:hidden split:gap-2">
      {children}
    </div>
  )
}

export function ResultView({ analysis }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const { t, n, lang } = useI18n()
  const settled = analysis.status === 'done' || analysis.status === 'failed'

  useEffect(() => {
    // `nearest` so a screen tall enough to show everything does not move.
    if (settled) box.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [settled])

  if (analysis.status === 'running') return <StatusText tone="muted">{t('analysing')}</StatusText>
  if (analysis.status === 'failed') {
    return (
      <Box ref={box}>
        <StatusText tone="error">
          {analysis.error
            ? t(ANALYSIS_ERROR_KEYS[analysis.error], { duration: duration(MIN_ANALYSIS_S, lang) })
            : t('errorWorkerFailed')}
        </StatusText>
      </Box>
    )
  }
  if (analysis.status !== 'done' || !analysis.result) return <Box ref={box} />

  const { rpm, pulsesPerS, pulseTimesS, octaveAdjusted } = analysis.result

  return (
    <Box ref={box}>
      <p className="m-0 flex items-baseline gap-2 tabular-nums" data-testid="result" dir="ltr">
        <span
          className="text-end"
          css={css`
            /* Scales with the screen and never wraps the unit onto a second
               line; 4ch holds five figures without the number jumping about
               as it changes. */
            font-size: clamp(3rem, 12vmin, 6rem);
            font-weight: 700;
            line-height: 1;
            letter-spacing: -0.02em;
            min-inline-size: 4ch;
          `}
        >
          {Math.round(rpm)}
        </span>
        <span className="text-[1.1rem] text-muted">{t('rpm')}</span>
      </p>
      <p className="m-0 text-[0.95rem] text-muted" data-testid="result-caption">
        {t('marked', { count: n(pulseTimesS.length) })}
        {octaveAdjusted ? ` · ${t(octaveKey(rpm, pulsesPerS))}` : ''}
      </p>
    </Box>
  )
}
