/** Minimal RIFF/WAVE reader for 16-bit PCM mono files (the test fixtures). */
export interface WavData {
  sampleRate: number
  samples: Float32Array
}

export function parseWav(bytes: ArrayBuffer): WavData {
  const view = new DataView(bytes)
  const tag = (o: number) => String.fromCharCode(...new Uint8Array(bytes, o, 4))
  if (tag(0) !== 'RIFF' || tag(8) !== 'WAVE') throw new Error('not a WAVE file')

  let offset = 12
  let sampleRate = 0
  let channels = 0
  let bitsPerSample = 0
  let data: Int16Array | null = null

  while (offset + 8 <= view.byteLength) {
    const id = tag(offset)
    const size = view.getUint32(offset + 4, true)
    const body = offset + 8
    if (id === 'fmt ') {
      const format = view.getUint16(body, true)
      channels = view.getUint16(body + 2, true)
      sampleRate = view.getUint32(body + 4, true)
      bitsPerSample = view.getUint16(body + 14, true)
      if (format !== 1 || bitsPerSample !== 16) throw new Error('only 16-bit PCM is supported')
    } else if (id === 'data') {
      data = new Int16Array(bytes.slice(body, body + size))
    }
    offset = body + size + (size % 2)
  }
  if (!data || !sampleRate) throw new Error('missing fmt or data chunk')
  if (channels !== 1) throw new Error('only mono is supported')

  const samples = new Float32Array(data.length)
  for (let i = 0; i < data.length; i++) samples[i] = data[i] / 32768
  return { sampleRate, samples }
}

/**
 * The inverse: 16-bit PCM mono RIFF/WAVE, for saving a clip out of the app.
 * Same format the fixtures are in, so anything exported can go straight into
 * `test/fixtures/` or through `scripts/reference/analyse.py`.
 */
export function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const bytesPerSample = 2
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample)
  const view = new DataView(buffer)

  const tag = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i))
  }

  tag(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * bytesPerSample, true)
  tag(8, 'WAVE')
  tag(12, 'fmt ')
  view.setUint32(16, 16, true) // chunk size for PCM
  view.setUint16(20, 1, true) // format: PCM
  view.setUint16(22, 1, true) // channels: mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * bytesPerSample, true) // byte rate
  view.setUint16(32, bytesPerSample, true) // block align
  view.setUint16(34, 8 * bytesPerSample, true)
  tag(36, 'data')
  view.setUint32(40, samples.length * bytesPerSample, true)

  for (let i = 0; i < samples.length; i++) {
    // Clamp before scaling: a sample past full scale would wrap to the
    // opposite sign and put a click in the file.
    const clamped = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(44 + i * bytesPerSample, Math.round(clamped * 32767), true)
  }
  return buffer
}
