import { useCallback, useEffect, useRef, useState } from 'react'
import { sliceClip } from '../audio/decode'
import { loadFile } from '../audio/load'
import { createPlayer, type Player } from '../audio/player'
import { record, type Recording } from '../audio/record'
import { InputError, MAX_RECORD_S, type AudioClip, type InputErrorCode } from '../audio/types'
import { defaultSelection, type Selection } from '../waveform/selection'

const POSITION_STEP_S = 0.05

export type InputStatus = 'idle' | 'decoding' | 'loaded' | 'recording' | 'error'

export interface AudioInputState {
  status: InputStatus
  clip?: AudioClip
  /**
   * Rises with every clip loaded. Names are not unique — two recordings in the
   * same minute share one, and a file can be uploaded twice — so anything that
   * has to notice "this is a different clip now" keys off this instead.
   */
  clipId: number
  selection: Selection
  elapsedS: number
  /**
   * What went wrong, as a code, or `unknown` for anything without a name of
   * its own. The screen turns it into words.
   */
  error?: InputErrorCode | 'unknown'
  /** Development only: the underlying cause chain, shown beside the message. */
  errorDetail?: string
  playing: boolean
  positionS: number
}

/**
 * idle -> decoding -> loaded
 * idle -> recording -> decoding -> loaded
 * any  -> error -> idle (next action)
 */
export function useAudioInput() {
  const [state, setState] = useState<AudioInputState>({ status: 'idle', clipId: 0, selection: { startS: 0, endS: 0 }, elapsedS: 0, playing: false, positionS: 0 })
  const recording = useRef<Recording>(undefined)
  const player = useRef<Player>(undefined)
  const raf = useRef<number>(undefined)

  const stopPlayback = () => {
    player.current?.stop()
    if (raf.current) cancelAnimationFrame(raf.current)
    setState((s) => (s.playing ? { ...s, playing: false, positionS: 0 } : s))
  }

  const disposePlayer = () => {
    player.current?.dispose()
    player.current = undefined
    if (raf.current) cancelAnimationFrame(raf.current)
  }

  const fail = (e: unknown) => {
    // Not 'record-failed': an upload that fails for its own reasons must not
    // tell a user who never touched the microphone that recording failed.
    const code: InputErrorCode | 'unknown' = e instanceof InputError ? e.code : 'unknown'
    let detail: string | undefined
    if (import.meta.env.DEV) {
      // debug aid: the underlying cause chain, while diagnosing on the phone
      const chain: string[] = []
      let c: unknown = e
      while (c && chain.length < 4) {
        const err = c as { name?: string; message?: string; cause?: unknown }
        chain.push(`${err.name ?? typeof c}: ${err.message ?? String(c)}`)
        c = err.cause
      }
      detail = chain.join(' <- ')
      console.error('audio input failed', e)
    }
    setState((s) => ({ ...s, status: 'error', error: code, errorDetail: detail, playing: false, positionS: 0 }))
  }

  const setClip = (clip: AudioClip) => {
    disposePlayer()
    const p = createPlayer(clip)
    p.onEnded(() => setState((s) => ({ ...s, playing: false, positionS: 0 })))
    player.current = p
    setState((s) => ({
      status: 'loaded',
      clip,
      clipId: s.clipId + 1,
      selection: defaultSelection(clip.durationS),
      elapsedS: 0,
      playing: false,
      positionS: 0,
    }))
  }

  const upload = useCallback(async (file: File) => {
    recording.current?.stop()
    setState((s) => ({ ...s, status: 'decoding', error: undefined, playing: false }))
    try {
      setClip(await loadFile(file))
    } catch (e) {
      fail(e)
    }
  }, [])

  const startRecording = useCallback(() => {
    // Stop playback but keep the player: `setClip` disposes it when a
    // recording actually arrives. Disposing here left a refused recording, a
    // denied microphone above all, with a loaded clip whose Play button did
    // nothing until the file was loaded again.
    stopPlayback()
    setState((s) => ({ ...s, status: 'recording', elapsedS: 0, error: undefined, playing: false, positionS: 0 }))
    recording.current = record({
      maxS: MAX_RECORD_S,
      onTick: (elapsedS) => setState((s) => (s.status === 'recording' ? { ...s, elapsedS } : s)),
      onDone: (clip) => {
        recording.current = undefined
        setClip(clip)
      },
      onError: (e) => {
        recording.current = undefined
        fail(e)
      },
    })
  }, [])

  const stopRecording = useCallback(() => {
    recording.current?.stop()
    setState((s) => (s.status === 'recording' ? { ...s, status: 'decoding' } : s))
  }, [])

  const dismissError = useCallback(() => {
    setState((s) => ({ ...s, status: s.clip ? 'loaded' : 'idle', error: undefined }))
  }, [])

  const setSelection = useCallback((selection: Selection) => {
    stopPlayback()
    setState((s) => ({ ...s, selection }))
  }, [])

  const togglePlay = useCallback(() => {
    const p = player.current
    if (!p) return
    if (p.playing()) {
      stopPlayback()
      return
    }
    setState((s) => {
      p.play(s.selection.startS, s.selection.endS)
      return { ...s, playing: true, positionS: s.selection.startS }
    })
    // The indicator is a 1 px line: quantise to ~20 Hz so a 10 s playback is
    // ~200 React commits and canvas redraws instead of ~600.
    const tick = () => {
      if (!player.current?.playing()) return
      const at = player.current.position()
      setState((s) => (Math.abs(at - s.positionS) >= POSITION_STEP_S ? { ...s, positionS: at } : s))
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => () => {
    recording.current?.stop()
    disposePlayer()
  }, [])

  /**
   * The selected window as its own clip, cut on demand. Deliberately not a
   * memo on the selection: that copied up to 640 kB on every pointer move of a
   * drag, for a value only the analysis needs, once, when Calculate is pressed.
   */
  const getWindowClip = useCallback(
    () => (state.clip ? sliceClip(state.clip, state.selection.startS, state.selection.endS) : undefined),
    [state.clip, state.selection],
  )

  return { state, getWindowClip, upload, startRecording, stopRecording, dismissError, togglePlay, setSelection }
}
