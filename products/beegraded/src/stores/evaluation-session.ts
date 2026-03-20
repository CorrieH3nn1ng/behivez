import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ParsedRubric } from './token'

export type EvalSessionStep = 1 | 2 | 3 | 4

export interface EvalSession {
  id: string
  rubric_id: number | null
  rubric: ParsedRubric | null
  subject: string
  mode: 'A' | 'B'
  draft_paper_id: number | null
  draft_evaluation_id: number | null
  final_paper_id: number | null
  final_evaluation_id: number | null
  created_at: string
}

const STORAGE_KEY = 'bg_eval_session'

function generateSessionId(): string {
  return 'EVS-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase()
}

export const useEvalSessionStore = defineStore('evalSession', () => {
  const session = ref<EvalSession | null>(null)

  // Restore from sessionStorage
  const saved = sessionStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      session.value = JSON.parse(saved)
    } catch { /* ignore */ }
  }

  const hasRubric = computed(() => !!session.value?.rubric_id)
  const hasDraft = computed(() => !!session.value?.draft_paper_id)
  const hasDraftEval = computed(() => !!session.value?.draft_evaluation_id)
  const hasFinal = computed(() => !!session.value?.final_paper_id)
  const hasFinalEval = computed(() => !!session.value?.final_evaluation_id)

  const currentStep = computed<EvalSessionStep>(() => {
    if (!session.value) return 1
    if (!session.value.rubric_id) return 1
    if (!session.value.draft_evaluation_id) return 2
    if (!session.value.final_evaluation_id) return 3
    return 4
  })

  function startNew(): EvalSession {
    const s: EvalSession = {
      id: generateSessionId(),
      rubric_id: null,
      rubric: null,
      subject: '',
      mode: 'A',
      draft_paper_id: null,
      draft_evaluation_id: null,
      final_paper_id: null,
      final_evaluation_id: null,
      created_at: new Date().toISOString(),
    }
    session.value = s
    persist()
    return s
  }

  function update(partial: Partial<EvalSession>) {
    if (session.value) {
      Object.assign(session.value, partial)
      persist()
    }
  }

  function clear() {
    session.value = null
    sessionStorage.removeItem(STORAGE_KEY)
  }

  function persist() {
    if (session.value) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session.value))
    }
  }

  return {
    session,
    hasRubric,
    hasDraft,
    hasDraftEval,
    hasFinal,
    hasFinalEval,
    currentStep,
    startNew,
    update,
    clear,
  }
})
