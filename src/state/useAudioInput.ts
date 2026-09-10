import { useCallback, useEffect, useRef, useState } from 'react'
import { loadFile } from '../audio/load'
import { createPlayer, type Player } from '../audio/player'
import { record, type Recording } from '../audio/record'
import { InputError, MAX_RECORD_S, type AudioClip } from '../audio/types'

export type InputStatus = 'idle' | 'decoding' | 'loaded' | 'recording' | 'error'

export interface AudioInputState {
  status: InputStatus
  clip?: AudioClip
  elapsedS: number
  error?: string
  playing: boolean
  positionS: number
}

/**
 * idle -> decoding -> loaded
 * idle -> recording -> decoding -> loaded
 * any  -> error -> idle (next action)
 */
export function useAudioInput() {
  const [state, setState] = useState<AudioInputState>({ status: 'idle', elapsedS: 0, playing: false, positionS: 0 })
  const recording = useRef<Recording>(undefined)
  const player = useRef<Player>(undefined)
  const raf = useRef<number>(undefined)

  const disposePlayer = () => {
    player.current?.dispose()
    player.current = undefined
    if (raf.current) cancelAnimationFrame(raf.current)
  }

  const fail = (e: unknown) => {
    let message = e instanceof InputError ? e.message : 'Something went wrong. Try again.'
    if (import.meta.env.DEV) {
      // debug aid: show the underlying cause chain while diagnosing on the phone
      const chain: string[] = []
      let c: unknown = e
      while (c && chain.length < 4) {
        const err = c as { name?: string; message?: string; cause?: unknown }
        chain.push(`${err.name ?? typeof c}: ${err.message ?? String(c)}`)
        c = err.cause
      }
      message += ` [dev: ${chain.join(' <- ')}]`
      console.error('audio input failed', e)
    }
    setState((s) => ({ ...s, status: 'error', error: message, playing: false, positionS: 0 }))
  }

  const setClip = (clip: AudioClip) => {
    disposePlayer()
    const p = createPlayer(clip)
    p.onEnded(() => setState((s) => ({ ...s, playing: false, positionS: 0 })))
    player.current = p
    setState({ status: 'loaded', clip, elapsedS: 0, playing: false, positionS: 0 })
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
    disposePlayer()
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

  const togglePlay = useCallback(() => {
    const p = player.current
    if (!p) return
    if (p.playing()) {
      p.stop()
      setState((s) => ({ ...s, playing: false, positionS: 0 }))
      return
    }
    p.play()
    setState((s) => ({ ...s, playing: true }))
    const tick = () => {
      if (!player.current?.playing()) return
      setState((s) => ({ ...s, positionS: player.current?.position() ?? 0 }))
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => () => {
    recording.current?.stop()
    disposePlayer()
  }, [])

  return { state, upload, startRecording, stopRecording, dismissError, togglePlay }
}
