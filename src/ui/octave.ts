import { REVS_PER_PULSE } from '../dsp/types'
import type { MessageKey } from '../i18n'

/**
 * The marks are always the raw detection, never the corrected figure: when the
 * range doubles a reading it is because combustions were missed, and there is
 * no honest way to draw marks that were never found. Rather than let the comb
 * quietly disagree with the number by the very factor it exists to expose,
 * say what the range decided the marks mean.
 */
export function octaveKey(rpm: number, pulsesPerS: number): MessageKey {
  const raw = pulsesPerS * 60 * REVS_PER_PULSE
  return rpm > raw ? 'octaveUp' : 'octaveDown'
}
