import { useRef } from 'react'
import { useI18n } from '../i18n'
import { SAMPLES, SAMPLES_ENABLED, sampleFile, sampleUrl } from '../samples'
import { Button, Sheet } from './kit'

interface Props {
  disabled?: boolean
  onFile: (file: File) => void
}

/**
 * The bundled recordings, offered the way an upload is: whatever is picked
 * becomes a File and goes down the same path, so the waveform, the crop and
 * Calculate cannot tell the difference.
 *
 * Phase 8 gave it this home. It is a third way to load audio, so it belongs
 * beside Open and Record — but as an icon and a sheet, not a fourth labelled
 * button and an inline list. The source row is what sets the width of the
 * control column in the split layout, and a list that unfolds inside it would
 * push the waveform down every time someone opened it. A sheet costs the row
 * one icon and the layout nothing, and it matches the settings beside it.
 *
 * None of this ships by default: `SAMPLES_ENABLED` is off in a release build.
 */
export function SampleButton({ disabled, onFile }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const { t, n } = useI18n()
  if (!SAMPLES_ENABLED) return null

  const pick = async (num: number) => {
    dialog.current?.close()
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
      <Button
        shape="icon"
        disabled={disabled}
        aria-label={t('pickSample')}
        onClick={() => dialog.current?.showModal()}
      >
        <SamplesIcon />
      </Button>
      <Sheet ref={dialog} title={t('pickSample')}>
        {/* The bundled recordings, one per row. */}
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {SAMPLES.map((s) => (
              <li key={s.n}>
                {/* The name is deliberately not translated: it is a number, and
                    seven labels in seventeen languages would say nothing more. */}
                <Button shape="wide" disabled={disabled} onClick={() => void pick(s.n)}>
                  Sample {s.n}{' '}
                  <span className="text-muted tabular-nums">
                    ≈{n(s.rpm)} {t('rpm')}
                  </span>
                </Button>
              </li>
            ))}
        </ul>
        <Button onClick={() => dialog.current?.close()}>{t('dismiss')}</Button>
      </Sheet>
    </>
  )
}

/** A stack of clips, which is what the list is. */
function SamplesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <rect x="3" y="4.5" width="14" height="3.2" rx="1.1" />
      <rect x="3" y="10" width="14" height="3.2" rx="1.1" />
      <path d="M5.5 16.4h9" strokeLinecap="round" />
    </svg>
  )
}
