import type { AudioClip } from './types'

export interface Player {
  play: () => void
  stop: () => void
  /** Seconds into the clip, 0 when not playing. */
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
    play: () => {
      stop()
      void ctx.resume()
      node = ctx.createBufferSource()
      node.buffer = buffer
      node.connect(ctx.destination)
      node.onended = () => {
        node = undefined
        endedCb?.()
      }
      startedAt = ctx.currentTime
      node.start()
    },
    stop,
    position: () => (node ? Math.min(ctx.currentTime - startedAt, clip.durationS) : 0),
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
