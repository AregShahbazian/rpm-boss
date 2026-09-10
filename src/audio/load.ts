import { decodeToClip } from './decode'
import { InputError, MAX_FILE_BYTES, SAMPLE_RATE, type AudioClip, type AudioSource } from './types'

/**
 * Decode any browser-decodable audio container to the app clip. Browser only.
 * The AudioContext is created at the app rate so the browser's own resampler
 * delivers 16 kHz directly; `decodeToClip` then only mixes to mono. Should the
 * WebView ignore the requested rate, `decodeToClip` still resamples.
 */
export async function decodeBuffer(buf: ArrayBuffer, source: AudioSource): Promise<AudioClip> {
  const ctx = new AudioContext({ sampleRate: SAMPLE_RATE })
  try {
    let decoded: AudioBuffer
    try {
      decoded = await ctx.decodeAudioData(buf)
    } catch (e) {
      throw new InputError('undecodable', e)
    }
    const channels: Float32Array[] = []
    for (let c = 0; c < decoded.numberOfChannels; c++) channels.push(decoded.getChannelData(c))
    return decodeToClip(channels, decoded.sampleRate, source)
  } finally {
    void ctx.close()
  }
}

/** Upload path: size gate first, then Web Audio decode. */
export async function loadFile(file: File): Promise<AudioClip> {
  if (file.size > MAX_FILE_BYTES) throw new InputError('too-large')
  const buf = await file.arrayBuffer()
  return decodeBuffer(buf, { kind: 'file', name: file.name })
}
