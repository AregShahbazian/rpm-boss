/** Min/max per column over a sample span, for drawing a waveform. */
export interface Peaks {
  min: Float32Array
  max: Float32Array
}

export function computePeaks(samples: Float32Array, fromSample: number, toSample: number, columns: number): Peaks {
  const min = new Float32Array(columns)
  const max = new Float32Array(columns)
  const from = Math.max(0, Math.floor(fromSample))
  const to = Math.min(samples.length, Math.ceil(toSample))
  const span = Math.max(0, to - from)
  if (columns === 0 || span === 0) return { min, max }
  for (let c = 0; c < columns; c++) {
    let a = from + Math.floor((c * span) / columns)
    let b = from + Math.floor(((c + 1) * span) / columns)
    if (b <= a) b = a + 1 // more columns than samples: repeat the single sample
    if (a >= to) a = to - 1
    if (b > to) b = to
    let lo = Infinity
    let hi = -Infinity
    for (let i = a; i < b; i++) {
      const v = samples[i]
      if (v < lo) lo = v
      if (v > hi) hi = v
    }
    min[c] = lo
    max[c] = hi
  }
  return { min, max }
}
