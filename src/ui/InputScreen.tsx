import { useAudioInput } from '../state/useAudioInput'
import { Player } from './Player'
import { RecordButton } from './RecordButton'
import { StatusLine } from './StatusLine'
import { UploadButton } from './UploadButton'
import { WaveformBlock } from './WaveformBlock'

export function InputScreen() {
  const { state, upload, startRecording, stopRecording, dismissError, togglePlay, setSelection } = useAudioInput()
  const busy = state.status === 'decoding' || state.status === 'recording'

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
        </>
      )}
    </main>
  )
}
