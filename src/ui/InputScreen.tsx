import { useState } from 'react'
import { useAnalysis } from '../state/useAnalysis'
import { useAudioInput } from '../state/useAudioInput'
import type { AudioClip } from '../audio/types'
import type { ExpectedRange } from '../dsp/types'
import { useI18n } from '../i18n'
import { ExportButton } from './ExportButton'
import { LanguagePicker } from './LanguagePicker'
import { MicCheck } from './MicCheck'
import { Player } from './Player'
import { RangeFields } from './RangeFields'
import { ResultView } from './ResultView'
import { RecordButton } from './RecordButton'
import { SampleButton } from './SampleButton'
import { StatusLine } from './StatusLine'
import { UploadButton } from './UploadButton'
import { WaveformBlock } from './WaveformBlock'

export function InputScreen() {
  const { state, getWindowClip, upload, startRecording, stopRecording, dismissError, togglePlay, setSelection } =
    useAudioInput()
  const [range, setRange] = useState({ minRpm: '', maxRpm: '' })
  const { t } = useI18n()
  // Any change to the clip or the window clears the last result.
  const windowKey = `${state.clipId}:${state.selection.startS}:${state.selection.endS}`
  const { analysis, analyse } = useAnalysis(windowKey)

  const busy = state.status === 'decoding' || state.status === 'recording'
  const running = analysis.status === 'running'

  // Held so the marks are drawn against the window that was analysed, not
  // whatever the crop is now. It is overwritten on each Calculate and never
  // cleared; nothing renders it unless `useAnalysis` says the run is done, and
  // that is reset the moment the clip or the window changes.
  const [analysed, setAnalysed] = useState<AudioClip | undefined>(undefined)

  const onCalculate = () => {
    const clip = getWindowClip()
    if (!clip) return
    setAnalysed(clip)
    void analyse(clip, windowKey, parseRange(range))
  }

  return (
    <main className="screen">
      {/* No title: the launcher, the tab and the app switcher all carry the
          name already, and on a phone the screen is short enough that a
          heading costs more than it says. */}
      <div className="row">
        <UploadButton disabled={busy} onFile={upload} />
        <RecordButton
          recording={state.status === 'recording'}
          elapsedS={state.elapsedS}
          disabled={state.status === 'decoding'}
          onStart={startRecording}
          onStop={stopRecording}
        />
        <SampleButton disabled={busy} onFile={upload} />
      </div>
      <LanguagePicker />
      <StatusLine state={state} onDismiss={dismissError} />
      <MicCheck />
      {state.clip && state.status !== 'recording' && (
        <>
          <WaveformBlock
            clip={state.clip}
            selection={state.selection}
            onChange={setSelection}
            positionS={state.playing ? state.positionS : undefined}
          />
          <Player
            playing={state.playing}
            positionS={state.playing ? state.positionS - state.selection.startS : 0}
            durationS={state.selection.endS - state.selection.startS}
            onToggle={togglePlay}
          />
          <RangeFields {...range} disabled={running} onChange={setRange} />
          <button type="button" className="btn" disabled={busy || running} onClick={onCalculate}>
            {t('calculate')}
          </button>
          <ResultView analysis={analysis} clip={analysed} />
          <ExportButton clip={state.clip} selection={state.selection} />
        </>
      )}
    </main>
  )
}

/** Both fields filled and sane, or no range at all. */
function parseRange(fields: { minRpm: string; maxRpm: string }): ExpectedRange | undefined {
  const minRpm = Number(fields.minRpm)
  const maxRpm = Number(fields.maxRpm)
  if (!fields.minRpm || !fields.maxRpm || !(minRpm > 0) || !(maxRpm > minRpm)) return undefined
  return { minRpm, maxRpm }
}
