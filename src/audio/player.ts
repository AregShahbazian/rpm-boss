import type { AudioClip } from './types'

export interface Player {
  /** Play [startS, endS) of the clip; defaults to the whole clip. */
  play: (startS?: number, endS?: number) => void
  stop: () => void
  /** Absolute seconds into the clip, 0 when not playing. */
  position: () => number
  playing: () => boolean
  onEnded: (cb: () => void) => void
  dispose: () => void
}

/** Web Audio playback of a clip. One AudioBufferSourceNode per play(). */
export function createPlayer(clip: AudioClip): Player {
  const ctx = new AudioContext()
  const buffer = ctx.createBuffer(1, clip.samples.length, clip.sampleRate)
  buffer.getChannelData(0).set(clip.samples)

  let node: AudioBufferSourceNode | undefined
  let startedAt = 0
  let winStart = 0
  let winEnd = clip.durationS
  let endedCb: (() => void) | undefined

  const stop = () => {
    if (!node) return
    const n = node
    node = undefined
    n.onended = null
    try {
      n.stop()
    } catch {
      /* already stopped */
    }
    n.disconnect()
  }

  return {
    play: (startS = 0, endS = clip.durationS) => {
      stop()
      void ctx.resume()
      winStart = Math.max(0, Math.min(startS, clip.durationS))
      winEnd = Math.max(winStart, Math.min(endS, clip.durationS))
      node = ctx.createBufferSource()
      node.buffer = buffer
      node.connect(ctx.destination)
      node.onended = () => {
        node = undefined
        endedCb?.()
      }
      startedAt = ctx.currentTime
      node.start(0, winStart, winEnd - winStart)
    },
    stop,
    position: () => (node ? Math.min(winStart + (ctx.currentTime - startedAt), winEnd) : 0),
    playing: () => node !== undefined,
    onEnded: (cb) => {
      endedCb = cb
    },
    dispose: () => {
      stop()
      void ctx.close()
    },
  }
}
