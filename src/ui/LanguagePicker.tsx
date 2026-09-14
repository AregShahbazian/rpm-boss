import {sortedLanguages, useI18n} from '../i18n'
import {Picker} from './kit'

/**
 * The language, as a `<select>` in the settings dialog; see `SettingsButton`.
 *
 * The styling and the native-control argument both live in `Picker` now, which
 * the tachometer's two settings share.
 */
export function LanguagePicker() {
  const {lang, setLang, t} = useI18n()
  return (
    <Picker
      label={t('languageLabel')}
      value={lang}
      options={sortedLanguages().map((l) => ({value: l.code, label: l.name}))}
      onChange={setLang}
    />
  )
}
