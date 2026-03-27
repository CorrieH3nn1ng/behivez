<template>
  <q-page class="honeycomb-bg">
    <div class="page-container" style="max-width: 750px;">
      <!-- Header -->
      <div class="test-header q-mb-md">
        <div class="row items-center justify-between">
          <div>
            <h2 class="text-h5 text-weight-bold q-mb-none" style="color: #1c1917;">
              {{ template?.name || (lang === 'af' ? 'Probleemoplossing' : 'Problem Solving') }}
            </h2>
            <div class="text-caption text-grey-7">
              {{ t('answered') }}: {{ answeredCount }}/{{ totalQuestions }}
              <span class="q-ml-md">
                <q-icon name="calculate" size="14px" class="q-mr-xs" />
                {{ lang === 'af' ? 'Sakrekenaar toegelaat' : 'Calculator allowed' }}
              </span>
            </div>
          </div>
          <MathTimer
            v-if="timerActive"
            :time-remaining="timeRemaining"
            :total-seconds="template?.time_limit_sec || 3600"
            @time-up="handleTimeUp"
          />
        </div>
        <q-linear-progress
          :value="answeredCount / Math.max(totalQuestions, 1)"
          color="amber"
          class="q-mt-sm"
          rounded
          size="8px"
        />
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner-gears color="amber" size="48px" />
        <div class="q-mt-md text-grey-7">
          {{ lang === 'af' ? 'Genereer vrae met KI...' : 'Generating questions with AI...' }}
        </div>
        <div class="text-caption text-grey-5 q-mt-xs">
          {{ lang === 'af' ? 'Dit kan tot 30 sekondes neem' : 'This may take up to 30 seconds' }}
        </div>
      </div>

      <!-- Questions -->
      <template v-if="!loading && questions.length > 0">
        <q-card
          v-for="(q, idx) in questions"
          :key="idx"
          flat
          class="bee-card q-pa-md q-mb-md"
          :class="{ 'answered-card': selectedAnswers[idx] !== undefined }"
        >
          <div class="row items-start q-mb-sm">
            <q-badge color="amber-8" class="q-mr-sm" style="font-size: 14px; padding: 4px 10px;">
              {{ idx + 1 }}
            </q-badge>
            <span class="text-caption text-grey-5">{{ q.category }}</span>
          </div>

          <!-- Bilingual question (language subjects show subject language as primary) -->
          <div class="question-text q-mb-md">
            <div class="text-weight-medium" style="font-size: 15px; line-height: 1.5;">
              {{ primaryQuestion(q) }}
            </div>
            <div class="text-caption text-grey-5 q-mt-xs" style="font-style: italic;">
              {{ secondaryQuestion(q) }}
            </div>
          </div>

          <!-- Options -->
          <q-list dense>
            <q-item
              v-for="(opt, optIdx) in q.options"
              :key="optIdx"
              clickable
              :active="selectedAnswers[idx] === optIdx"
              active-class="option-selected"
              class="option-item q-mb-xs"
              :class="getOptionClass(idx, optIdx)"
              :disable="!timerActive && showResults"
              @click="selectOption(idx, optIdx)"
            >
              <q-item-section>
                <span style="font-size: 15px;">{{ opt }}</span>
              </q-item-section>
              <q-item-section side v-if="showResults">
                <q-icon
                  v-if="isCorrectOption(idx, optIdx)"
                  name="check_circle"
                  color="positive"
                  size="20px"
                />
                <q-icon
                  v-if="isWrongSelected(idx, optIdx)"
                  name="cancel"
                  color="negative"
                  size="20px"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </template>

      <!-- Done Button -->
      <div v-if="timerActive && questions.length > 0" class="text-center q-mt-md q-mb-xl">
        <q-btn
          class="btn-bee"
          size="lg"
          no-caps
          icon="check_circle"
          :label="t('done')"
          :loading="submitting"
          @click="handleFinish"
        />
      </div>

      <!-- Error -->
      <q-banner v-if="error" class="bg-red-1 text-red-8 q-mt-md" rounded>
        <template #avatar><q-icon name="error" /></template>
        {{ error }}
        <template #action>
          <q-btn flat no-caps color="red" label="Probeer weer / Try again" @click="regenerate" />
        </template>
      </q-banner>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'src/i18n'
import { useMathTest } from 'src/composables/useMathTest'
import { useMathTestStore } from 'src/stores/math-test'
import MathTimer from 'src/components/MathTimer.vue'

const { t, lang } = useI18n()
const { getTemplate, submitAttempt, generateProblems } = useMathTest()
const store = useMathTestStore()
const route = useRoute()
const router = useRouter()

const template = ref<any>(null)
const questions = ref<any[]>([])
const selectedAnswers = ref<Record<number, number>>({})
const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const showResults = ref(false)

// Timer state (separate from store since problem solving has different duration)
const timeRemaining = ref(3600)
const timerActive = ref(false)
let timerInterval: ReturnType<typeof setInterval> | null = null

const answeredCount = computed(() => Object.keys(selectedAnswers.value).length)
const totalQuestions = computed(() => questions.value.length)

// For language subjects (english, afrikaans, setswana), always show the subject language as primary
const subjectCode = computed(() => (route.query.subject as string) || '')
const langSubjects = ['english', 'afrikaans', 'setswana']

function primaryQuestion(q: any): string {
  // Language subjects: show subject's language as primary
  if (subjectCode.value === 'english') return q.question_en || q.question_af
  if (subjectCode.value === 'afrikaans') return q.question_af || q.question_en
  if (subjectCode.value === 'setswana') return q.question_en || q.question_af // Setswana stored in question_en
  // Default (maths, natural science): use UI language
  return lang.value === 'af' ? (q.question_af || q.question_en) : (q.question_en || q.question_af)
}

function secondaryQuestion(q: any): string {
  // Show the translation as secondary (italic)
  if (subjectCode.value === 'english') return q.question_af || ''
  if (subjectCode.value === 'afrikaans') return q.question_en || ''
  if (subjectCode.value === 'setswana') return q.question_af || '' // English translation for parents
  return lang.value === 'af' ? (q.question_en || '') : (q.question_af || '')
}

function startTimer(seconds: number) {
  timeRemaining.value = seconds
  timerActive.value = true
  timerInterval = setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value--
    } else {
      handleTimeUp()
    }
  }, 1000)
}

function stopTimer() {
  timerActive.value = false
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function selectOption(questionIdx: number, optionIdx: number) {
  if (!timerActive.value) return
  selectedAnswers.value = { ...selectedAnswers.value, [questionIdx]: optionIdx }
}

function getOptionClass(qIdx: number, optIdx: number): string {
  if (!showResults.value) return ''
  if (isCorrectOption(qIdx, optIdx)) return 'option-correct'
  if (isWrongSelected(qIdx, optIdx)) return 'option-wrong'
  return ''
}

function isCorrectOption(qIdx: number, optIdx: number): boolean {
  if (!showResults.value) return false
  return questions.value[qIdx]?.correct === optIdx
}

function isWrongSelected(qIdx: number, optIdx: number): boolean {
  if (!showResults.value) return false
  return selectedAnswers.value[qIdx] === optIdx && questions.value[qIdx]?.correct !== optIdx
}

async function handleFinish() {
  stopTimer()
  await submitTest()
}

function handleTimeUp() {
  stopTimer()
  submitTest()
}

async function submitTest() {
  if (submitting.value) return
  submitting.value = true

  try {
    const answers = Object.entries(selectedAnswers.value).map(([idx, val]) => ({
      questionIndex: Number(idx),
      givenAnswer: val,
    }))

    const timeUsed = (template.value?.time_limit_sec || 3600) - timeRemaining.value

    const childId = route.query.childId ? Number(route.query.childId) : undefined
    const result = await submitAttempt(template.value.id, {
      playerName: store.playerName || 'Anonymous',
      answers,
      timeUsedSec: timeUsed,
      childId,
    })

    router.push({
      name: 'math-result',
      params: { attemptId: result.id },
      query: { templateId: template.value.id },
    })
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to submit test'
  } finally {
    submitting.value = false
  }
}

async function regenerate() {
  error.value = ''
  loading.value = true
  try {
    const data = await generateProblems({
      grade: 4,
      language: lang.value,
    })
    template.value = data
    questions.value = data.questions
    selectedAnswers.value = {}
    startTimer(data.time_limit_sec || 3600)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to generate test'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const templateId = Number(route.params.templateId)
  if (isNaN(templateId)) {
    error.value = 'Invalid test ID'
    loading.value = false
    return
  }

  try {
    const data = await getTemplate(templateId)
    template.value = data
    questions.value = data.questions
    startTimer(data.time_limit_sec || 3600)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load test'
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  stopTimer()
})
</script>

<style scoped>
.test-header {
  position: sticky;
  top: 50px;
  z-index: 10;
  background: rgba(255, 251, 235, 0.95);
  backdrop-filter: blur(8px);
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid #fde68a;
}
.answered-card {
  border-left: 3px solid #f59e0b;
}
.option-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 12px;
  transition: all 0.2s;
}
.option-item:hover {
  background: #fffbeb;
}
.option-selected {
  background: #fef3c7 !important;
  border-color: #f59e0b !important;
  font-weight: 600;
}
.option-correct {
  background: #dcfce7 !important;
  border-color: #16a34a !important;
}
.option-wrong {
  background: #fee2e2 !important;
  border-color: #dc2626 !important;
}
</style>
