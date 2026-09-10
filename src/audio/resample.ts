import { SAMPLE_RATE } from './types'

/** Arithmetic mean of the channels, sample by sample. One channel is copied. */
export function toMono(channels: Float32Array[]): Float32Array {
  if (channels.length === 0) throw new Error('no channels')
  const n = channels[0].length
  const out = new Float32Array(n)
  if (channels.length === 1) {
    out.set(channels[0])
    return out
  }
  const k = 1 / channels.length
  for (const ch of channels) {
    for (let i = 0; i < n; i++) out[i] += ch[i] * k
  }
  return out
}

/**
 * Windowed-sinc FIR lowpass (Blackman window), zero-phase by symmetric taps.
 * `cutoffHz` is relative to `sampleRate`. Edges are zero-padded.
 */
export function lowpassFir(x: Float32Array, sampleRate: number, cutoffHz: number, taps = 63): Float32Array {
  const half = (taps - 1) / 2
  const fc = cutoffHz / sampleRate
  const h = new Float64Array(taps)
  let sum = 0
  for (let i = 0; i < taps; i++) {
    const m = i - half
    const sinc = m === 0 ? 2 * fc : Math.sin(2 * Math.PI * fc * m) / (Math.PI * m)
    const w = 0.42 - 0.5 * Math.cos((2 * Math.PI * i) / (taps - 1)) + 0.08 * Math.cos((4 * Math.PI * i) / (taps - 1))
    h[i] = sinc * w
    sum += h[i]
  }
  for (let i = 0; i < taps; i++) h[i] /= sum

  const n = x.length
  const y = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    let acc = 0
    for (let j = 0; j < taps; j++) {
      const idx = i + j - half
      if (idx >= 0 && idx < n) acc += x[idx] * h[j]
    }
    y[i] = acc
  }
  return y
}

/**
 * Resample mono audio to 16 kHz. Anti-aliases with `lowpassFir` when
 * downsampling, then linearly interpolates. Linear interpolation is a known
 * simplification: the analysis band (60-2000 Hz) is far below the folding
 * frequency, so its error there is negligible.
 */
export function resampleTo16k(x: Float32Array, fromRate: number): Float32Array {
  if (fromRate === SAMPLE_RATE) return x
  const src = fromRate > SAMPLE_RATE ? lowpassFir(x, fromRate, 7200) : x
  const ratio = fromRate / SAMPLE_RATE
  const n = Math.round(x.length / ratio)
  const out = new Float32Array(n)
  const last = src.length - 1
  for (let i = 0; i < n; i++) {
    const pos = i * ratio
    const i0 = Math.floor(pos)
    if (i0 >= last) {
      out[i] = src[last]
      continue
    }
    const frac = pos - i0
    out[i] = src[i0] * (1 - frac) + src[i0 + 1] * frac
  }
  return out
}
