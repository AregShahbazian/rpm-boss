/**
 * `m:ss` or `m:ss.d`. Rounds to the requested precision *before* splitting
 * minutes, so 59.97 s reads "1:00.0" and never "0:60.0".
 */
export function formatTime(seconds: number, decimals: 0 | 1 = 0): string {
  const scale = 10 ** decimals
  const total = Math.round(Math.max(0, seconds) * scale) / scale
  const m = Math.floor(total / 60)
  const r = total - m * 60
  const rest = decimals === 0 ? String(r).padStart(2, '0') : r.toFixed(1).padStart(4, '0')
  return `${m}:${rest}`
}
