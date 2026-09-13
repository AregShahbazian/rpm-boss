import { useEffect, useRef } from 'react'
import { MIN_ANALYSIS_S } from '../dsp/types'
import type { AnalysisState } from '../state/useAnalysis'
import { duration, useI18n } from '../i18n'
import { ANALYSIS_ERROR_KEYS } from './errorKeys'
import { octaveKey } from './octave'
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
 * Two rules in the split block of the old stylesheet never applied: a plain
 * `.range { padding: 8px 12px }` and `.result { gap: 12px }` sat *after* it at
 * equal specificity, so they won. Writing the overrides as `split:` variants
 * here would make them take effect for the first time and shift the landscape
 * layout by 4 px, which this refactor must not do. The rendered behaviour is
 * what is reproduced; see the review note.
 */
function Box({ ref, children }: { ref: React.RefObject<HTMLDivElement | null>; children?: React.ReactNode }) {
  return (
    <div ref={ref} className="flex flex-col gap-3 empty:hidden">
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

  if (analysis.status === 'running') return <p className="m-0 min-h-[1.5em] text-muted">{t('analysing')}</p>
  if (analysis.status === 'failed') {
    return (
      <Box ref={box}>
        <p className="m-0 min-h-[1.5em] text-error">
          {analysis.error
            ? t(ANALYSIS_ERROR_KEYS[analysis.error], { duration: duration(MIN_ANALYSIS_S, lang) })
            : t('errorWorkerFailed')}
        </p>
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
