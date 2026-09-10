/**
 * Iterative radix-2 FFT, in place, on split real/imaginary arrays.
 *
 * Here only to make autocorrelation cheap: the direct form costs roughly
 * 28 million multiply-adds per one-second window, which is too slow on a phone
 * for a ten-window clip. Through the FFT it is a few hundred thousand.
 */

function reverseBits(value: number, bits: number): number {
  let out = 0
  for (let i = 0; i < bits; i++) {
    out = (out << 1) | ((value >>> i) & 1)
  }
  return out
}

/** Smallest power of two at least `n`. */
export function nextPowerOfTwo(n: number): number {
  let size = 1
  while (size < n) size *= 2
  return size
}

/** In-place transform. `inverse` skips the 1/n scaling; `ifft` applies it. */
export function fft(re: Float64Array, im: Float64Array, inverse = false): void {
  const n = re.length
  if (n !== im.length) throw new RangeError('re and im must be the same length')
  if (n === 0 || (n & (n - 1)) !== 0) throw new RangeError(`length must be a power of two, got ${n}`)

  const bits = Math.log2(n)
  for (let i = 0; i < n; i++) {
    const j = reverseBits(i, bits)
    if (j > i) {
      ;[re[i], re[j]] = [re[j], re[i]]
      ;[im[i], im[j]] = [im[j], im[i]]
    }
  }

  const sign = inverse ? 1 : -1
  for (let size = 2; size <= n; size *= 2) {
    const half = size / 2
    const step = (sign * 2 * Math.PI) / size
    for (let start = 0; start < n; start += size) {
      for (let k = 0; k < half; k++) {
        const angle = step * k
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        const i = start + k
        const j = i + half
        const tr = re[j] * cos - im[j] * sin
        const ti = re[j] * sin + im[j] * cos
        re[j] = re[i] - tr
        im[j] = im[i] - ti
        re[i] += tr
        im[i] += ti
      }
    }
  }
}

/** Inverse transform, scaled. */
export function ifft(re: Float64Array, im: Float64Array): void {
  fft(re, im, true)
  const n = re.length
  for (let i = 0; i < n; i++) {
    re[i] /= n
    im[i] /= n
  }
}

/**
 * Raw (unnormalised) autocorrelation of `x` for lags 0..maxLag, via the
 * Wiener-Khinchin route: the inverse transform of the power spectrum. `x` is
 * zero-padded to twice its length so the wrap-around of circular correlation
 * lands in the padding instead of in the answer.
 */
export function autocorrelate(x: Float64Array, maxLag: number): Float64Array {
  const size = nextPowerOfTwo(2 * x.length)
  const re = new Float64Array(size)
  const im = new Float64Array(size)
  re.set(x)

  fft(re, im)
  for (let i = 0; i < size; i++) {
    re[i] = re[i] * re[i] + im[i] * im[i]
    im[i] = 0
  }
  ifft(re, im)

  return re.slice(0, Math.min(maxLag + 1, x.length))
}
