import { REVS_PER_PULSE } from '../dsp/types'

/**
 * The marks are always the raw detection, never the corrected figure: when the
 * range doubles a reading it is because combustions were missed, and there is
 * no honest way to draw marks that were never found. Rather than let the comb
 * quietly disagree with the number by the very factor it exists to expose,
 * say what the range decided the marks mean.
 */
export function octaveNote(rpm: number, pulsesPerS: number): string {
  const raw = pulsesPerS * 60 * REVS_PER_PULSE
  return rpm > raw
    ? 'your range says each mark is two combustions'
    : 'your range says two marks are one combustion'
}
