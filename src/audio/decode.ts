import { resampleTo16k, toMono } from './resample'
import { InputError, MIN_CLIP_S, SAMPLE_RATE, type AudioClip, type AudioSource } from './types'

/** Pure: raw decoded channels at any rate -> the app's 16 kHz mono clip. */
export function decodeToClip(channels: Float32Array[], sampleRate: number, source: AudioSource): AudioClip {
  const samples = resampleTo16k(toMono(channels), sampleRate)
  return { sampleRate: SAMPLE_RATE, samples, durationS: samples.length / SAMPLE_RATE, source }
}

/**
 * Copy `[startS, endS)` of a clip. The single rounding rule for every cut:
 * the sample count comes from the *length*, so moving a window of a given
 * length never changes how many samples it yields.
 */
export function sliceClip(clip: AudioClip, startS: number, endS: number): AudioClip {
  const total = clip.samples.length
  const start = Math.min(Math.max(0, Math.round(startS * clip.sampleRate)), total)
  const count = Math.max(0, Math.round((endS - startS) * clip.sampleRate))
  const samples = clip.samples.slice(start, Math.min(total, start + count))
  return { ...clip, samples, durationS: samples.length / clip.sampleRate }
}

/** Keep at most `maxS` seconds from the start. */
export function trimClip(clip: AudioClip, maxS: number): AudioClip {
  return clip.durationS <= maxS ? clip : sliceClip(clip, 0, maxS)
}

/** Load gate shared by uploads and recordings. */
export function assertMinLength(clip: AudioClip): AudioClip {
  if (clip.durationS < MIN_CLIP_S) throw new InputError('too-short')
  return clip
}
