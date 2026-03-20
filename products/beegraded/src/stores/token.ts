import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type TokenStatus = 'active' | 'rubric_uploaded' | 'draft_evaluated' | 'final_evaluated' | 'expired'

export interface TokenData {
  id: number
  code: string
  email: string
  status: TokenStatus
  tier: 'token' | 'registered' | 'affiliate' | 'master'
  rubric_id: number | null
  draft_paper_id: number | null
  draft_evaluation_id: number | null
  final_paper_id: number | null
  final_evaluation_id: number | null
  expires_at: string
  rubric?: ParsedRubric | null
}

export interface GradingLevel {
  label: string
  range: string
  criteria: Record<string, string>
}

export interface ParsedRubric {
  id: number
  programme: string
  module_name: string
  nqf_level: number | null
  assessment_type: string
  total_marks: number
  questions: RubricQuestion[]
  confirmed: boolean
  original_filename: string
  structure_notes?: string[]
  grading_scale?: GradingLevel[]
}

export interface RubricQuestion {
  number: number
  title: string
  marks: number
  criteria: string[]
}

const STORAGE_KEY = 'bg_token_session'

export const useTokenStore = defineStore('token', () => {
  const tokenData = ref<TokenData | null>(null)
  const tokenCode = ref<string | null>(null)
  const loading = ref(false)

  // Restore from sessionStorage
  const saved = sessionStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      tokenData.value = parsed.tokenData
      tokenCode.value = parsed.tokenCode
    } catch { /* ignore */ }
  }

  const isValid = computed(() => !!tokenData.value && tokenData.value.status !== 'expired')
  const status = computed(() => tokenData.value?.status || null)
  const rubric = computed(() => tokenData.value?.rubric || null)
  const hasRubric = computed(() => !!tokenData.value?.rubric_id)
  const hasDraft = computed(() => !!tokenData.value?.draft_paper_id)
  const hasFinal = computed(() => !!tokenData.value?.final_paper_id)

  const currentStep = computed(() => {
    if (!tokenData.value) return 0
    const s = tokenData.value.status
    if (s === 'active') return 1 // Upload rubric
    if (s === 'rubric_uploaded') return 2 // Upload draft
    if (s === 'draft_evaluated') return 3 // Upload final
    if (s === 'final_evaluated') return 4 // Done
    return 0
  })

  function setToken(code: string, data: TokenData) {
    tokenCode.value = code
    tokenData.value = data
    persist()
  }

  function updateStatus(newStatus: TokenStatus) {
    if (tokenData.value) {
      tokenData.value.status = newStatus
      persist()
    }
  }

  function updateTokenData(partial: Partial<TokenData>) {
    if (tokenData.value) {
      Object.assign(tokenData.value, partial)
      persist()
    }
  }

  function clearToken() {
    tokenData.value = null
    tokenCode.value = null
    sessionStorage.removeItem(STORAGE_KEY)
  }

  function persist() {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      tokenCode: tokenCode.value,
      tokenData: tokenData.value,
    }))
  }

  return {
    tokenData,
    tokenCode,
    loading,
    isValid,
    status,
    rubric,
    hasRubric,
    hasDraft,
    hasFinal,
    currentStep,
    setToken,
    updateStatus,
    updateTokenData,
    clearToken,
  }
})
