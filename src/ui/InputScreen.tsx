import { useState } from 'react'
import { useAnalysis } from '../state/useAnalysis'
import { useAudioInput } from '../state/useAudioInput'
import type { ExpectedRange } from '../dsp/types'
import { Player } from './Player'
import { RangeFields } from './RangeFields'
import { ResultLine } from './ResultLine'
import { RecordButton } from './RecordButton'
import { StatusLine } from './StatusLine'
import { UploadButton } from './UploadButton'
import { WaveformBlock } from './WaveformBlock'

export function InputScreen() {
  const { state, getWindowClip, upload, startRecording, stopRecording, dismissError, togglePlay, setSelection } =
    useAudioInput()
  const [range, setRange] = useState({ minRpm: '', maxRpm: '' })
  // Any change to the clip or the window clears the last result.
  const windowKey = `${state.clipId}:${state.selection.startS}:${state.selection.endS}`
  const { analysis, analyse } = useAnalysis(windowKey)

  const busy = state.status === 'decoding' || state.status === 'recording'
  const running = analysis.status === 'running'

  const onCalculate = () => {
    const clip = getWindowClip()
    if (clip) void analyse(clip, windowKey, parseRange(range))
  }

  return (
    <main className="screen">
      <h1>rpm-boss</h1>
      <div className="row">
        <UploadButton disabled={busy} onFile={upload} />
        <RecordButton
          recording={state.status === 'recording'}
          elapsedS={state.elapsedS}
          disabled={state.status === 'decoding'}
          onStart={startRecording}
          onStop={stopRecording}
        />
      </div>
      <StatusLine state={state} onDismiss={dismissError} />
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
            Calculate
          </button>
          <ResultLine analysis={analysis} />
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
