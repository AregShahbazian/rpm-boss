import { useMemo, useState } from 'react'
import { useAnalysis } from '../state/useAnalysis'
import { useAudioInput } from '../state/useAudioInput'
import type { ExpectedRange } from '../dsp/types'
import { useI18n } from '../i18n'
import { ExportButton } from './ExportButton'
import { MicCheck } from './MicCheck'
import { Player } from './Player'
import { RangeFields } from './RangeFields'
import { ResultView } from './ResultView'
import { RecordButton } from './RecordButton'
import { Settings } from './Settings'
import { StatusLine } from './StatusLine'
import { UploadButton } from './UploadButton'
import { WaveformBlock, type Marks } from './WaveformBlock'

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

  // The window the marks belong to, held so they are drawn against what was
  // analysed rather than whatever the crop is now. It is replaced on each
  // Calculate; `useAnalysis` drops the result the moment the clip or the
  // window changes, which is what takes the marks off the waveform again.
  const [analysedWindow, setAnalysedWindow] = useState<{ offsetS: number; windowS: number } | undefined>(undefined)

  const marks = useMemo<Marks | undefined>(
    () =>
      analysis.status === 'done' && analysis.result && analysedWindow
        ? { timesS: analysis.result.pulseTimesS, offsetS: analysedWindow.offsetS, windowS: analysedWindow.windowS }
        : undefined,
    [analysis, analysedWindow],
  )

  const onCalculate = () => {
    const clip = getWindowClip()
    if (!clip) return
    setAnalysedWindow({ offsetS: state.selection.startS, windowS: clip.durationS })
    void analyse(clip, windowKey, parseRange(range))
  }

  // Nothing to split until there is something to show in the second column.
  const loaded = state.clip !== undefined && state.status !== 'recording'

  return (
    <main className={loaded ? 'screen' : 'screen screen-empty'}>
      {/* No title: the launcher, the tab and the app switcher all carry the
          name already, and on a phone the screen is short enough that a
          heading costs more than it says. */}
      <div className="row area-source">
        <UploadButton disabled={busy} onFile={upload} />
        <RecordButton
          recording={state.status === 'recording'}
          elapsedS={state.elapsedS}
          disabled={state.status === 'decoding'}
          onStart={startRecording}
          onStop={stopRecording}
        />
        <Settings />
      </div>
      <div className="area-status">
        <StatusLine state={state} onDismiss={dismissError} />
        <MicCheck />
      </div>
      {state.clip && state.status !== 'recording' && (
        <>
          <div className="area-wave">
            <WaveformBlock
              clip={state.clip}
              selection={state.selection}
              onChange={setSelection}
              positionS={state.playing ? state.positionS : undefined}
              marks={marks}
            />
          </div>
          <div className="area-transport">
            <Player
              playing={state.playing}
              positionS={state.playing ? state.positionS - state.selection.startS : 0}
              durationS={state.selection.endS - state.selection.startS}
              onToggle={togglePlay}
            />
            <ExportButton clip={state.clip} selection={state.selection} />
          </div>
          <div className="area-range">
            <RangeFields {...range} disabled={running} onChange={setRange} />
          </div>
          <button type="button" className="btn area-calc" disabled={busy || running} onClick={onCalculate}>
            {t('calculate')}
          </button>
          <div className="area-result">
            <ResultView analysis={analysis} />
          </div>
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
