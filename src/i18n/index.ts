import i18n from 'i18next'
import { initReactI18next, useTranslation } from 'react-i18next'
import { de as deLocale, enUS } from 'date-fns/locale'
import type { Locale } from 'date-fns'
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
  const langs = typeof navigator !== 'undefined' ? navigator.languages ?? [navigator.language] : []
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

/** Translation function plus the date-fns locale for the active language. */
export function useI18n() {
  const { t, i18n: instance } = useTranslation()
  const lang = (instance.language?.startsWith('de') ? 'de' : 'en') as Language
  return { t, lang, locale: dateLocale(lang) }
}

export default i18n
