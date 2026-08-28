import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enTranslation from './locales/en.json'
import mrTranslation from './locales/mr.json'
import hiTranslation from './locales/hi.json'
import taTranslation from './locales/ta.json'

const resources = {
  en: {
    translation: enTranslation
  },
  mr: {
    translation: mrTranslation
  },
  hi: {
    translation: hiTranslation
  },
  ta: {
    translation: taTranslation
  }
}

// Check local storage for saved language, default to 'en'
const savedLanguage = localStorage.getItem('kairos_language') || 'en'

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values
    }
  })

export default i18n
