/**
 * The live screen: incoming audio and an RPM that keeps moving.
 *
 * A proof of concept, and deliberately not much of a screen. It is untranslated
 * and it shows its own timings, both of which a shipping version would not do;
 * the timings are the point of the experiment and are read off the phone.
 */
import { useEffect } from 'react'
import { LIVE_INTERVAL_MS, LIVE_WINDOW_S } from '../live/ring'
import { useLive } from '../state/useLive'
import { LiveScope } from './LiveScope'

interface Props {
  onExit: () => void
}

export function LiveScreen({ onExit }: Props) {
  const { live, ring, start, stop } = useLive()

  // Opening the microphone is the whole reason this screen exists, so it
  // happens on arrival rather than behind another press.
  useEffect(start, [start])

  const leave = () => {
    stop()
    onExit()
  }

  const { stats } = live

  return (
    <main className="screen live">
      <div className="row">
        <button type="button" className="btn" onClick={leave}>
          ← Back
        </button>
        <span className="muted live-source">
          {live.status === 'listening' ? (live.source ?? 'listening') : live.status}
        </span>
      </div>

      <LiveScope ring={ring} />

      <p className="rpm live-rpm">
        <span className="rpm-value mono">{live.rpm === undefined ? '—' : Math.round(live.rpm)}</span>
        <span className="rpm-unit">rpm</span>
      </p>

      <p className="muted mono live-stats">
        {live.errorCode ? (
          <span className="error">{live.errorCode}</span>
        ) : (
          <>
            window {LIVE_WINDOW_S.toFixed(1)}s · every {LIVE_INTERVAL_MS}ms
            <br />
            analysis {stats.lastMs.toFixed(0)}ms now · {stats.avgMs.toFixed(0)}ms avg · {stats.maxMs.toFixed(0)}ms worst
            <br />
            {stats.runs} runs · {stats.skipped} skipped · capture {(stats.captureRatio * 100).toFixed(0)}%
            <br />
            raw {live.rawRpm === undefined ? '—' : Math.round(live.rawRpm)} · confidence{' '}
            {live.confidence === undefined ? '—' : live.confidence.toFixed(2)}
            {live.quiet ? ` · ${live.quiet}` : ''}
          </>
        )}
      </p>
    </main>
  )
}
