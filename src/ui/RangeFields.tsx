import { useState } from 'react'
import { useI18n } from '../i18n'

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
export function RangeFields({ minRpm, maxRpm, disabled, onChange }: Props) {
  const [open, setOpen] = useState(readOpen)
  const { t } = useI18n()

  return (
    <details
      className="range"
      open={open}
      onToggle={(e) => {
        const next = e.currentTarget.open
        setOpen(next)
        writeOpen(next)
      }}
    >
      <summary className="muted">{t('rangeLegend')}</summary>
      <div className="row">
        <label>
          {t('rangeMin')}
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={100}
            value={minRpm}
            disabled={disabled}
            onChange={(e) => onChange({ minRpm: e.target.value, maxRpm })}
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
            onChange={(e) => onChange({ minRpm, maxRpm: e.target.value })}
          />
        </label>
      </div>
    </details>
  )
}
