import { InputError, type AudioClip } from '../audio/types'
import { MIN_CLIP_S, type Selection } from './selection'

/** The window as its own clip. The source clip is untouched. */
export function sliceClip(clip: AudioClip, sel: Selection): AudioClip {
  const start = Math.max(0, Math.round(sel.startS * clip.sampleRate))
  const end = Math.min(clip.samples.length, Math.round(sel.endS * clip.sampleRate))
  const samples = clip.samples.slice(start, end)
  return { ...clip, samples, durationS: samples.length / clip.sampleRate }
}

/** Load gate shared by uploads and recordings. */
export function assertMinLength(clip: AudioClip): AudioClip {
  if (clip.durationS < MIN_CLIP_S) throw new InputError('too-short')
  return clip
}
