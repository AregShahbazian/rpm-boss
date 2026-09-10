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
