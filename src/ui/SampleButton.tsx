import { useState } from 'react'
import { useI18n } from '../i18n'
import { SAMPLES, SAMPLES_ENABLED, sampleFile, sampleUrl } from '../samples'

interface Props {
  disabled?: boolean
  onFile: (file: File) => void
}

/**
 * The bundled recordings, offered the way an upload is: whatever is picked
 * becomes a File and goes down the same path, so the waveform, the crop and
 * Calculate cannot tell the difference.
 *
 * Placement and looks are phase 8's. This is the working control, not its
 * final home.
 */
export function SampleButton({ disabled, onFile }: Props) {
  const { t, n } = useI18n()
  const [open, setOpen] = useState(false)
  if (!SAMPLES_ENABLED) return null

  const pick = async (num: number) => {
    setOpen(false)
    let body: BlobPart[] = []
    try {
      body = [await (await fetch(sampleUrl(num))).blob()]
    } catch {
      // Offline, or the file is not in this build. An empty file fails to
      // decode, which the status line already knows how to say.
    }
    onFile(new File(body, sampleFile(num), { type: 'audio/mp4' }))
  }

  return (
    <>
      <button type="button" className="btn" disabled={disabled} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {t('pickSample')}
      </button>
      {open && (
        <ul className="samples">
          {SAMPLES.map((s) => (
            <li key={s.n}>
              {/* The name is deliberately not translated: it is a number, and
                  seven labels in seventeen languages would say nothing more. */}
              <button type="button" className="btn" disabled={disabled} onClick={() => void pick(s.n)}>
                Sample {s.n}{' '}
                <span className="muted mono">
                  ≈{n(s.rpm)} {t('rpm')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
