import {useRef} from 'react'
import {type MessageKey, useI18n} from '../i18n'
import {Icon} from './Icon'
import {Button, Picker, Sheet} from './kit'
import {LanguagePicker} from './LanguagePicker'
import {type Motion, MOTIONS, useMotion} from './liveSettings'
import {type Theme, THEMES, useTheme} from './theme'

const THEME_KEYS: Record<Theme, MessageKey> = {
  system: 'themeSystem',
  light: 'themeLight',
  dark: 'themeDark',
}

const MOTION_KEYS: Record<Motion, MessageKey> = {
  smooth: 'liveMotionSmooth',
  step: 'liveMotionStep',
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
export function SettingsButton() {
  const dialog = useRef<HTMLDialogElement>(null)
  const {t} = useI18n()
  const [theme, setTheme] = useTheme()
  const [motion, setMotion] = useMotion()

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
        {/*
          * Closed until asked for, and closed by a `<details>` rather than by
          * a piece of state: it brings its own disclosure semantics, its own
          * keyboard handling and its own marker, which is the same argument
          * that made the dialog a `<dialog>` and the language a `<select>`.
          *
          * The theme above it stays a plain section. Two settings a rider will
          * open once and never again do not deserve the same standing as the
          * one that decides whether the screen is readable in daylight.
          */}
        <hr className="m-0 w-full border-0 border-t border-solid border-btn"/>
        <details className="[&>summary]:cursor-pointer">
          <summary className="text-[0.9rem] text-muted">{t('tachoSettings')}</summary>
          <div className="mt-3 flex flex-col gap-3">
            <Picker
              label={t('liveMotionLabel')}
              value={motion}
              options={MOTIONS.map((v) => ({value: v, label: t(MOTION_KEYS[v])}))}
              onChange={setMotion}
              layout="row"
            />
          </div>
        </details>
        <Button onClick={() => dialog.current?.close()}>{t('dismiss')}</Button>
      </Sheet>
    </>
  )
}

