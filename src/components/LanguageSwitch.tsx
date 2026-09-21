import { LANGUAGES, setLanguage, useI18n, type Language } from '../i18n'

/** Compact language picker, usable before login. */
export function LanguageSwitch() {
  const { t, lang } = useI18n()
  return (
    <select
      className="select select-compact"
      aria-label={t('common.language')}
      value={lang}
      onChange={(e) => setLanguage(e.target.value as Language)}
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  )
}
