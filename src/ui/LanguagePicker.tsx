import {sortedLanguages, useI18n} from '../i18n'
import {css} from '@emotion/react'

/**
 * A native `<select>`, deliberately. On a phone it opens the platform's own
 * list, which is scrollable, searchable on Android, and already drawn in the
 * user's language. A custom dropdown would be a worse version of that.
 *
 * It lives in the settings dialog; see `Settings`.
 */
export function LanguagePicker() {
  const {lang, setLang, t} = useI18n()
  return (
    <label
      className="flex flex-col gap-1.5 text-[0.9rem]"
      css={css`
        select {
          padding: 8px;
          border-radius: 6px;
          border: 1px solid var(--color-btn);
          background: var(--color-btn);
          color: inherit;
          font: inherit;
        }
      `}
    >
      <span className="text-muted">{t('languageLabel')}</span>
      <select id="language" value={lang} onChange={(e) => setLang(e.target.value)}>
        {sortedLanguages().map((l) => (
          <option key={l.code} value={l.code}>
            {l.name}
          </option>
        ))}
      </select>
    </label>
  )
}
