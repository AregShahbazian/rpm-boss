import { useRef } from 'react'
import { useI18n, type MessageKey } from '../i18n'
import { LanguagePicker } from './LanguagePicker'
import { THEMES, useTheme, type Theme } from './theme'

const THEME_KEYS: Record<Theme, MessageKey> = {
  system: 'themeSystem',
  light: 'themeLight',
  dark: 'themeDark',
}

/**
 * Language and theme, behind one icon.
 *
 * Both used to have nowhere to live: the language picker sat in the middle of
 * the measuring flow because that is where it was added, and the theme had no
 * control at all. Neither is touched while measuring an engine, and neither is
 * worth a row of the screen, so they share a dialog.
 *
 * A native `<dialog>`, deliberately, like the native `<select>` inside it: it
 * brings its own backdrop, its own focus trap and Escape to close, and a
 * hand-rolled sheet would be a worse version of all three.
 */
export function Settings() {
  const dialog = useRef<HTMLDialogElement>(null)
  const { t } = useI18n()
  const [theme, setTheme] = useTheme()

  /**
   * A press on the backdrop closes it.
   *
   * A backdrop press is reported against the dialog element itself, but so is
   * a press on the dialog's own padding, so the target alone would close the
   * sheet when someone taps the margin beside a control. The point has to be
   * outside the box as well. Both conditions also keep a keyboard-driven
   * click, which arrives at 0,0 from a control inside, from closing it.
   */
  const closeOnBackdrop = (e: React.MouseEvent<HTMLDialogElement>) => {
    const el = dialog.current
    if (!el || e.target !== el) return
    const r = el.getBoundingClientRect()
    const outside = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom
    if (outside) el.close()
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-icon"
        aria-label={t('settings')}
        onClick={() => dialog.current?.showModal()}
      >
        <GearIcon />
      </button>
      <dialog className="sheet" ref={dialog} onClick={closeOnBackdrop}>
        <h2>{t('settings')}</h2>
        <div className="sheet-body">
          <LanguagePicker />
          <fieldset className="themes">
            <legend>{t('theme')}</legend>
            {THEMES.map((value) => (
              <label key={value}>
                <input
                  type="radio"
                  name="theme"
                  value={value}
                  checked={theme === value}
                  onChange={() => setTheme(value)}
                />
                <span>{t(THEME_KEYS[value])}</span>
              </label>
            ))}
          </fieldset>
          <button type="button" className="btn" onClick={() => dialog.current?.close()}>
            {t('dismiss')}
          </button>
        </div>
      </dialog>
    </>
  )
}

function GearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="10" cy="10" r="2.75" />
      <path
        d="M10 2.2l1.1 2.05 2.3-.35.6 2.24 2.05 1.1-1.2 1.99 1.2 1.99-2.05 1.1-.6 2.24-2.3-.35L10 17.8l-1.1-2.05-2.3.35-.6-2.24-2.05-1.1 1.2-1.99-1.2-1.99 2.05-1.1.6-2.24 2.3.35z"
        strokeLinejoin="round"
      />
    </svg>
  )
}
