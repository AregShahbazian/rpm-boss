/**
 * How loud a clip is *drawn*, which is not how loud it is.
 *
 * Nothing in the app normalises audio, and nothing should: the analysis is
 * gain-invariant (`windowEstimate` divides by the variance, `prominences`
 * measures in standard deviations), and the microphone is opened with every
 * processor off on purpose, so a recording arrives far below full scale while
 * an imported file — normalised by whatever produced it — arrives near it. Drawn
 * at a fixed scale the two look like different instruments: the import fills the
 * canvas and the recording is a hairline, which reads as a failed take rather
 * than a quiet room.
 *
 * So the scaling lives here, in the drawing, and never touches the samples.
 */

/**
 * Below this the clip is silence and is drawn flat rather than amplified.
 *
 * `LiveScope` holds the same number for the same reason. They are deliberately
 * not one shared constant: that scope's gain is recomputed every frame from the
 * last fraction of a second, so it tracks the signal and this cannot, and
 * pretending the two scales are the same thing would invite someone to try to
 * make them agree.
 */
const NOISE_FLOOR = 0.002

/** What the reference level is drawn at, as a fraction of the half-height. */
const TARGET = 0.95

/**
 * Most a clip may be amplified. The floor above already refuses silence; this
 * catches the clip that is barely above it, where the only thing left to make
 * full-height is the noise of the room.
 */
const MAX_GAIN = 50

/**
 * Which amplitude is brought to `TARGET`, as a fraction of the samples below it.
 *
 * Not the peak: a door closing, a knock on the tank, one clipped sample at the
 * moment the microphone opens — any of them is louder than the engine and would
 * scale the whole clip down to nothing. Not a low percentile either, which is
 * the opposite failure: an imported file with an ordinary crest factor has most
 * of its samples well under its peak, so bringing, say, its 99th percentile up
 * to full height would drive the loud tenth of a second clean off the canvas and
 * draw it as a solid block. A thousandth is high enough to sit just under the
 * real peak of a steady engine note and still ignore a handful of stray samples.
 */
const PERCENTILE = 0.999

/** Resolution of the histogram the percentile is read from. */
const BINS = 1024

/**
 * The factor to draw `samples` at, at least 1 and at most `MAX_GAIN`.
 *
 * Computed over the whole clip, and it must stay that way: taken over the
 * visible range instead, the waveform would rescale itself as the window is
 * dragged or zoomed, and a quiet passage would be indistinguishable from a loud
 * one because both would be drawn full height.
 *
 * O(n) in one pass — a histogram rather than a sort, because this runs on a
 * phone over every sample of the clip.
 */
export function displayGain(samples: Float32Array): number {
  if (samples.length === 0) return 1

  const histogram = new Int32Array(BINS)
  for (let i = 0; i < samples.length; i++) {
    const a = Math.abs(samples[i])
    const bin = a >= 1 ? BINS - 1 : (a * BINS) | 0
    histogram[bin]++
  }

  const wanted = samples.length * PERCENTILE
  let seen = 0
  let bin = 0
  while (bin < BINS - 1 && seen + histogram[bin] < wanted) {
    seen += histogram[bin]
    bin++
  }
  // The bin's upper edge, so the reference is never under-stated and the gain
  // never over-stated: rounding here costs a little height, and the other way
  // it would cost clipping.
  const reference = (bin + 1) / BINS

  if (reference <= NOISE_FLOOR) return 1
  return Math.min(MAX_GAIN, Math.max(1, TARGET / reference))
}
