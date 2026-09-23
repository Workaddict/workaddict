import i18n from 'i18next'
import { initReactI18next, useTranslation } from 'react-i18next'
import { de as deLocale, enUS } from 'date-fns/locale'
import { format, type Locale } from 'date-fns'
import { formatTime } from '../domain/time'
import { useTimeFormat } from '../timeFormat'
import de from './de'
import en from './en'

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
] as const
export type Language = (typeof LANGUAGES)[number]['code']

const STORAGE_KEY = 'workaddict.lang'

function readStored(): Language | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'en' || v === 'de' ? v : null
  } catch {
    return null
  }
}

export function detectLanguage(): Language {
  const stored = readStored()
  if (stored) return stored
  const langs =
    typeof navigator !== 'undefined' ? (navigator.languages ?? [navigator.language]) : []
  for (const l of langs) {
    const base = l?.slice(0, 2).toLowerCase()
    if (base === 'de' || base === 'en') return base
  }
  return 'en'
}

export function setLanguage(lang: Language) {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // storage unavailable: choice lasts for this session only
  }
  void i18n.changeLanguage(lang)
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, de: { translation: de } },
  lng: detectLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React escapes output
  returnNull: false,
})

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
})
document.documentElement.lang = i18n.language

export function dateLocale(lang: string): Locale {
  return lang.startsWith('de') ? deLocale : enUS
}

/**
 * Translation function, the date-fns locale for the active language, and clock-time formatters
 * that follow the device's 24h/12h choice.
 */
export function useI18n() {
  const { t, i18n: instance } = useTranslation()
  const timeFormat = useTimeFormat()
  const lang = (instance.language?.startsWith('de') ? 'de' : 'en') as Language
  const locale = dateLocale(lang)
  return {
    t,
    lang,
    locale,
    timeFormat,
    /** "14:30" or "2:30 PM". */
    time: (d: Date | string | number) => formatTime(d, timeFormat),
    /** Short date plus time, e.g. "23.09.2026, 14:30". */
    dateTime: (d: Date | string | number) =>
      `${format(new Date(d), 'P', { locale })}, ${formatTime(d, timeFormat)}`,
  }
}

export default i18n
