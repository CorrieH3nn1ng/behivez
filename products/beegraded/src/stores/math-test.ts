import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface MathQuestion {
  question: string
  operation: string
  answer?: number
}

interface MathAnswer {
  questionIndex: number
  givenAnswer: number
  correct?: boolean
  timeMs?: number
}

interface MathTemplate {
  id: number
  name: string
  grade: number
  operations: string[]
  time_limit_sec: number
  question_count: number
  language: string
  questions: MathQuestion[]
}

const PLAYER_KEY = 'bg_math_player'
const LANG_KEY = 'bg_math_lang'

export const useMathTestStore = defineStore('math-test', () => {
  // Persisted state
  const playerName = ref(localStorage.getItem(PLAYER_KEY) || '')
  const language = ref(localStorage.getItem(LANG_KEY) || 'af')

  // Test session state
  const currentTemplate = ref<MathTemplate | null>(null)
  const answers = ref<MathAnswer[]>([])
  const timeRemaining = ref(0)
  const testActive = ref(false)
  const testStartedAt = ref<number>(0)

  // Timer
  let timerInterval: ReturnType<typeof setInterval> | null = null

  // Computed
  const answeredCount = computed(() => answers.value.length)
  const totalQuestions = computed(() => currentTemplate.value?.question_count || 0)
  const allAnswered = computed(() => answeredCount.value >= totalQuestions.value)

  // Actions
  function setPlayerName(name: string) {
    playerName.value = name
    localStorage.setItem(PLAYER_KEY, name)
  }

  function setLanguage(lang: string) {
    language.value = lang
    localStorage.setItem(LANG_KEY, lang)
  }

  function startTest(template: MathTemplate) {
    currentTemplate.value = template
    answers.value = []
    timeRemaining.value = template.time_limit_sec
    testActive.value = true
    testStartedAt.value = Date.now()

    // Start countdown
    if (timerInterval) clearInterval(timerInterval)
    timerInterval = setInterval(() => {
      if (timeRemaining.value > 0) {
        timeRemaining.value--
      } else {
        stopTimer()
      }
    }, 1000)
  }

  function answerQuestion(index: number, value: number) {
    // Remove existing answer for this question if any
    const existing = answers.value.findIndex(a => a.questionIndex === index)
    if (existing >= 0) {
      answers.value.splice(existing, 1)
    }
    answers.value.push({
      questionIndex: index,
      givenAnswer: value,
      timeMs: Date.now() - testStartedAt.value,
    })
  }

  function stopTimer() {
    testActive.value = false
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  function finishTest() {
    stopTimer()
  }

  function getTimeUsedSec(): number {
    if (!currentTemplate.value) return 0
    return currentTemplate.value.time_limit_sec - timeRemaining.value
  }

  function reset() {
    stopTimer()
    currentTemplate.value = null
    answers.value = []
    timeRemaining.value = 0
    testStartedAt.value = 0
  }

  return {
    // State
    playerName,
    language,
    currentTemplate,
    answers,
    timeRemaining,
    testActive,

    // Computed
    answeredCount,
    totalQuestions,
    allAnswered,

    // Actions
    setPlayerName,
    setLanguage,
    startTest,
    answerQuestion,
    finishTest,
    getTimeUsedSec,
    reset,
  }
})
