import {useState} from 'react'
import {useI18n} from '../i18n'
import {css} from '@emotion/react'

interface Props {
  minRpm: string
  maxRpm: string
  disabled: boolean
  onChange: (next: { minRpm: string; maxRpm: string }) => void
}

const OPEN_KEY = 'rpm-boss.range-open'

/** Storage can throw in a private window, and a preference is not worth an error. */
function readOpen(): boolean {
  try {
    return localStorage.getItem(OPEN_KEY) === 'true'
  } catch {
    return false
  }
}

function writeOpen(open: boolean): void {
  try {
    localStorage.setItem(OPEN_KEY, String(open))
  } catch {
    // no persistence available; the section still works for this session
  }
}

/**
 * Optional expected range, folded away by default: most recordings do not need
 * it, and it is the only part of the screen that asks the user to type. Whether
 * it is open is remembered on the device, so someone who always uses it opens
 * it once.
 *
 * Values are kept as strings so both fields can be empty, which is the normal
 * case; `analyse` ignores anything that is not a usable range.
 */
export function RangeFields({minRpm, maxRpm, disabled, onChange}: Props) {
  const [open, setOpen] = useState(readOpen)
  const {t} = useI18n()

  return (
    <details
      className="m-0 rounded-md border border-btn px-3 py-2 split:py-1.5"
      css={css`
        summary {
          font-size: 0.9rem;
          cursor: pointer;
          padding: 4px 0;
          list-style-position: inside;
        }

        &[open] summary {
          margin-block-end: 8px;
        }

        label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9rem;
        }

        input {
          inline-size: 6em;
          padding: 6px 8px;
          border-radius: 6px;
          border: 1px solid var(--color-btn);
          background: var(--color-btn);
          color: inherit;
          font: inherit;
        }
      `}
      open={open}
      onToggle={(e) => {
        const next = e.currentTarget.open
        setOpen(next)
        writeOpen(next)
      }}
    >
      <summary className="text-muted">{t('rangeLegend')}</summary>
      <div className="flex flex-wrap gap-3">
        <label>
          {t('rangeMin')}
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={100}
            value={minRpm}
            disabled={disabled}
            onChange={(e) => onChange({minRpm: e.target.value, maxRpm})}
          />
        </label>
        <label>
          {t('rangeMax')}
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={100}
            value={maxRpm}
            disabled={disabled}
            onChange={(e) => onChange({minRpm, maxRpm: e.target.value})}
          />
        </label>
      </div>
    </details>
  )
}
