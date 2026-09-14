import {useRef} from 'react'
import {type MessageKey, useI18n} from '../i18n'
import {Icon} from './Icon'
import {Button, Sheet} from './kit'
import {LanguagePicker} from './LanguagePicker'
import {type Theme, THEMES, useTheme} from './theme'

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
  const {t} = useI18n()
  const [theme, setTheme] = useTheme()

  return (
    <>
      <Button shape="icon" aria-label={t('settings')} onClick={() => dialog.current?.showModal()}>
        <Icon icon="lucide:settings"/>
      </Button>
      <Sheet ref={dialog} title={t('settings')}>
        <LanguagePicker/>
        <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
          <legend className="mb-1.5 p-0 text-[0.9rem] text-muted">{t('theme')}</legend>
          {THEMES.map((value) => (
            <label key={value} className="flex min-h-11 items-center gap-2">
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
        <Button onClick={() => dialog.current?.close()}>{t('dismiss')}</Button>
      </Sheet>
    </>
  )
}

