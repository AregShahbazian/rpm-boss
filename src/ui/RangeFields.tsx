interface Props {
  minRpm: string
  maxRpm: string
  disabled: boolean
  onChange: (next: { minRpm: string; maxRpm: string }) => void
}

/**
 * Optional expected range. Kept as strings so both fields can be empty, which
 * is the normal case; `analyse` ignores anything that is not a usable range.
 */
export function RangeFields({ minRpm, maxRpm, disabled, onChange }: Props) {
  return (
    <fieldset className="range">
      <legend className="muted">Expected range (optional)</legend>
      <div className="row">
        <label>
          Min
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
          Max
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
    </fieldset>
  )
}
