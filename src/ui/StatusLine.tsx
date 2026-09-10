import type { AudioInputState } from '../state/useAudioInput'

interface Props {
  state: AudioInputState
  onDismiss: () => void
}

export function StatusLine({ state, onDismiss }: Props) {
  switch (state.status) {
    case 'idle':
      return <p className="status muted">Upload a recording or record the engine.</p>
    case 'decoding':
      return <p className="status">Decoding…</p>
    case 'recording':
      return <p className="status">Recording… hold the phone near the engine.</p>
    case 'error':
      return (
        <p className="status error" role="alert">
          {state.error}{' '}
          <button type="button" className="link" onClick={onDismiss}>
            Dismiss
          </button>
        </p>
      )
    case 'loaded':
      return (
        <p className="status">
          Loaded: {state.clip?.source.name} · {state.clip?.durationS.toFixed(1)} s
        </p>
      )
  }
}
