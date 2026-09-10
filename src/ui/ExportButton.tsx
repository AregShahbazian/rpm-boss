import type { AudioClip } from '../audio/types'
import { encodeWav } from '../dsp/wav'
import type { Selection } from '../waveform/selection'

interface Props {
  clip: AudioClip
  selection: Selection
}

const pad = (n: number) => String(n).padStart(2, '0')

/** `rpm-boss-2026-09-10-1932-w2.0-12.0.wav` — window bounds in the name. */
function fileName(selection: Selection): string {
  const d = new Date()
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  return `rpm-boss-${stamp}-w${selection.startS.toFixed(1)}-${selection.endS.toFixed(1)}.wav`
}

/**
 * Development only. Saves the loaded clip as 16-bit mono WAV, the format the
 * fixtures use, so a recording that misbehaves can be kept instead of being
 * lost to a page reload. The whole clip is written, not the window; the window
 * bounds go in the file name so the case can be reproduced exactly.
 */
export function ExportButton({ clip, selection }: Props) {
  if (!import.meta.env.DEV) return null

  const save = () => {
    const blob = new Blob([encodeWav(clip.samples, clip.sampleRate)], { type: 'audio/wav' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName(selection)
    link.click()
    // Revoking in the same tick races the browser's read of the blob in some
    // versions; a tick later the download has already been handed off.
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  return (
    <button type="button" className="link" onClick={save}>
      Export recording (dev)
    </button>
  )
}
