import { useAudioInput } from '../state/useAudioInput'
import { Player } from './Player'
import { RecordButton } from './RecordButton'
import { StatusLine } from './StatusLine'
import { UploadButton } from './UploadButton'

export function InputScreen() {
  const { state, upload, startRecording, stopRecording, dismissError, togglePlay } = useAudioInput()
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
        <Player playing={state.playing} positionS={state.positionS} durationS={state.clip.durationS} onToggle={togglePlay} />
      )}
    </main>
  )
}
