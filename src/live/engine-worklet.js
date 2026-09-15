/**
 * Copied from `~/git/revbench/engine-processor.js`, unedited below this note.
 *
 * revbench is where this synthesis was measured: `scripts/check.py` there
 * renders it at a dozen speeds and reads each clip back through rpm-boss's own
 * scipy baseline. The constants below are the results of that — the ring
 * frequencies, the noise corner, and above all the jitter limits, past which
 * the autocorrelation starts preferring two or three periods to one. They are
 * not taste, and this is not the copy to tune them in.
 *
 * The two copies do not track each other. If one changes, the other has to be
 * changed on purpose, and the sweep has to be re-run on that side.
 */
/**
 * One cylinder, two strokes or four, synthesised a sample at a time.
 *
 * A four-stroke fires once every two revolutions and a two-stroke once every
 * one, so the combustion rate is rpm / (60 * revsPerPulse) Hz — the number
 * rpm-boss measures and multiplies back up by its own assumption about the
 * engine. Each firing is a sharp burst of lowpassed noise plus a decaying
 * exhaust ring,
 * which is what survives the analyser's 60-2000 Hz band, rectifier and 150 Hz
 * envelope filter as one clean pulse.
 *
 * The small per-cycle jitter in period and amplitude is deliberate: a perfectly
 * regular pulse train sounds like a buzzer, and the engines this is for do not
 * run smoothly either. It stays under a few percent so the autocorrelation
 * still locks.
 */
const TWO_PI = Math.PI * 2

/**
 * Exhaust resonance, fixed by the pipe rather than by engine speed.
 *
 * Lower for a two-stroke: its expansion chamber is the loud part of the sound,
 * and the ring has to stay well clear of the combustion rate, which at the same
 * rpm is twice a four-stroke's. Near it, the analyser's envelope beats against
 * the ring and reads back an octave out.
 */
const RING_HZ = {1: 120, 2: 180}
/** Corner of the noise burst's lowpass — the body of the bark. */
const NOISE_HZ = 1000
/**
 * How much each combustion's loudness varies, and each period's length.
 *
 * Both are measured limits, not taste. Above roughly 10% amplitude spread the
 * autocorrelation starts preferring two or three periods to one and the reading
 * comes back a quarter or a half low; period jitter above ~1.5% does the same at
 * the top of the range. These values ran clean over 600-12,000 rpm in
 * scripts/check.py.
 */
const AMP_JITTER = 0.07

class EngineProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {name: 'rpm', defaultValue: 1200, minValue: 300, maxValue: 15000, automationRate: 'k-rate'},
      {name: 'level', defaultValue: 0.5, minValue: 0, maxValue: 1, automationRate: 'k-rate'},
      {name: 'jitter', defaultValue: 0.012, minValue: 0, maxValue: 0.2, automationRate: 'k-rate'},
      /** Revolutions per combustion: 2 for a four-stroke, 1 for a two-stroke. */
      {name: 'revsPerPulse', defaultValue: 2, minValue: 1, maxValue: 2, automationRate: 'k-rate'},
    ]
  }

  constructor() {
    super()
    this.t = 0 // seconds since the last combustion
    this.period = 0.1
    this.amp = 1
    this.noise = 0
    this.running = true
    this.port.onmessage = (e) => {
      if (e.data === 'stop') this.running = false
    }
  }

  process(_inputs, outputs, params) {
    const out = outputs[0]
    const sr = sampleRate
    const dt = 1 / sr
    const rpm = params.rpm[0]
    const level = params.level[0]
    const jitter = params.jitter[0]
    const revs = Math.round(params.revsPerPulse[0])
    const ringHz = RING_HZ[revs]
    const noiseA = 1 - Math.exp((-TWO_PI * NOISE_HZ) / sr)

    for (let i = 0; i < out[0].length; i++) {
      if (this.t >= this.period) {
        this.t -= this.period
        this.period = ((60 * revs) / rpm) * (1 + jitter * (Math.random() * 2 - 1))
        this.amp = 1 + AMP_JITTER * (Math.random() * 2 - 1)
      }

      const decay = Math.min(0.03, 0.3 * this.period)
      const attack = 1 - Math.exp(-this.t / 0.0008)
      const env = attack * Math.exp(-this.t / decay)

      const white = Math.random() * 2 - 1
      this.noise += (white - this.noise) * noiseA
      const ring = Math.sin(TWO_PI * ringHz * this.t) * Math.exp(-this.t / Math.min(0.05, 0.5 * this.period))

      const s = Math.tanh(1.5 * (this.amp * env * (0.9 * this.noise + 0.5 * ring) + 0.01 * white)) * level
      for (const channel of out) channel[i] = s
      this.t += dt
    }
    return this.running
  }
}

registerProcessor('engine', EngineProcessor)
