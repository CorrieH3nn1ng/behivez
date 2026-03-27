import { ref, computed } from 'vue'
import af from './af'
import en from './en'
import tn from './tn'

type TranslationKey = keyof typeof af

const messages: Record<string, Record<TranslationKey, string>> = { af, en, tn }

// Reactive language state — persisted to localStorage
const STORAGE_KEY = 'bg_math_lang'
const storedLang = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
const currentLang = ref<string>(storedLang || 'en')

export function useI18n() {
  const lang = computed(() => currentLang.value)

  function t(key: TranslationKey): string {
    return messages[currentLang.value]?.[key] || messages.af[key] || key
  }

  function setLanguage(newLang: string) {
    if (messages[newLang]) {
      currentLang.value = newLang
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, newLang)
      }
    }
  }

  function toggleLanguage() {
    const order = ['af', 'en', 'tn']
    const idx = order.indexOf(currentLang.value)
    setLanguage(order[(idx + 1) % order.length])
  }

  const availableLanguages = [
    { code: 'af', label: 'Afrikaans' },
    { code: 'en', label: 'English' },
    { code: 'tn', label: 'Setswana' },
  ]

  return { t, lang, setLanguage, toggleLanguage, availableLanguages }
}
