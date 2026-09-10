import { resampleTo16k, toMono } from './resample'
import { SAMPLE_RATE, type AudioClip, type AudioSource } from './types'

/** Pure: raw decoded channels at any rate -> the app's 16 kHz mono clip. */
export function decodeToClip(channels: Float32Array[], sampleRate: number, source: AudioSource): AudioClip {
  const samples = resampleTo16k(toMono(channels), sampleRate)
  return { sampleRate: SAMPLE_RATE, samples, durationS: samples.length / SAMPLE_RATE, source }
}

/** Keep at most `maxS` seconds from the start. */
export function trimClip(clip: AudioClip, maxS: number): AudioClip {
  const max = Math.floor(maxS * clip.sampleRate)
  if (clip.samples.length <= max) return clip
  const samples = clip.samples.slice(0, max)
  return { ...clip, samples, durationS: samples.length / clip.sampleRate }
}
