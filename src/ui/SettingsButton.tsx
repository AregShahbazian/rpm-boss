import {useRef} from 'react'
import {type MessageKey, useI18n} from '../i18n'
import {CYLINDER_COUNTS, CYLINDERS, type Stroke, STROKES, useStroke} from './engineSettings'
import {Icon} from './Icon'
import {Button, Segmented, Sheet} from './kit'
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

const STROKE_KEYS: Record<Stroke, MessageKey> = {
  '2': 'strokeTwo',
  '4': 'strokeFour',
}

/** One line of the settings from the next. */
const Divider = () => <hr className="m-0 w-full border-0 border-t border-solid border-btn"/>

/**
 * Everything the app remembers about its user, behind one icon.
 *
 * Two of them used to have nowhere to live: the language picker sat in the
 * middle of the measuring flow because that is where it was added, and the
 * theme had no control at all. None of these is touched while measuring an
 * engine, and none is worth a row of the screen, so they share a dialog.
 *
 * A native `<dialog>`, deliberately, like the native `<select>` inside it: it
 * brings its own backdrop, its own focus trap and Escape to close, and a
 * hand-rolled sheet would be a worse version of all three.
 */
export function SettingsButton() {
  const dialog = useRef<HTMLDialogElement>(null)
  const {t, n} = useI18n()
  const [theme, setTheme] = useTheme()
  const [motion, setMotion] = useMotion()
  const [stroke, setStroke] = useStroke()

  return (
    <>
      <Button shape="icon" aria-label={t('settings')} onClick={() => dialog.current?.showModal()}>
        <Icon icon="lucide:settings"/>
      </Button>
      <Sheet ref={dialog} title={t('settings')}>
        <LanguagePicker/>
        <Segmented
          label={t('theme')}
          value={theme}
          options={THEMES.map((v) => ({value: v, label: t(THEME_KEYS[v])}))}
          onChange={setTheme}
        />
        <Divider/>
        {/*
          * The engine, not the gauge, which is why it is out here rather than
          * in the tachometer section below: it is a fact about the motorcycle,
          * and the one thing on this screen a two-stroke rider has to change.
          */}
        <Segmented
          label={t('strokeLabel')}
          value={stroke}
          options={STROKES.map((v) => ({value: v, label: t(STROKE_KEYS[v])}))}
          onChange={setStroke}
        />
        {/*
          * No divider above it: it is the same subject as the row before, and
          * the count answers itself — see `engineSettings`. The numerals go
          * through `n` because the reader's digits are not always these ones.
          */}
        <Segmented
          label={t('cylindersLabel')}
          value={CYLINDERS}
          options={CYLINDER_COUNTS.map((v) => ({value: v, label: n(Number(v))}))}
          onChange={() => {}}
          disabled
        />
        <Divider/>
        {/*
          * Closed until asked for, and closed by a `<details>` rather than by
          * a piece of state: it brings its own disclosure semantics, its own
          * keyboard handling and its own marker, which is the same argument
          * that made the dialog a `<dialog>` and the language a `<select>`.
          *
          * The rows above it stay in the open. A setting a rider will open once
          * and never again does not deserve the same standing as the one that
          * decides whether the screen is readable in daylight, or the one that
          * says what engine is being listened to.
          */}
        <details className="[&>summary]:cursor-pointer">
          <summary className="text-[0.9rem] text-muted">{t('tachoSettings')}</summary>
          <div className="mt-3 flex flex-col gap-3">
            <Segmented
              label={t('liveMotionLabel')}
              value={motion}
              options={MOTIONS.map((v) => ({value: v, label: t(MOTION_KEYS[v])}))}
              onChange={setMotion}
            />
          </div>
        </details>
        <Divider/>
        <Button onClick={() => dialog.current?.close()}>{t('dismiss')}</Button>
      </Sheet>
    </>
  )
}

