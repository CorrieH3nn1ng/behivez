<template>
  <q-page class="honeycomb-bg">
    <div class="page-container" style="max-width: 750px;">
      <!-- Header: Title + Timer + Progress -->
      <div class="test-header q-mb-md">
        <div class="row items-center justify-between">
          <div>
            <h2 class="text-h5 text-weight-bold q-mb-none" style="color: #1c1917;">
              {{ template?.name || t('math_speed_test') }}
            </h2>
            <div class="text-caption text-grey-7">
              {{ t('answered') }}: {{ store.answeredCount }}/{{ store.totalQuestions }}
            </div>
          </div>
          <MathTimer
            v-if="store.testActive"
            :time-remaining="store.timeRemaining"
            :total-seconds="template?.time_limit_sec || 360"
            @time-up="handleTimeUp"
          />
        </div>

        <!-- Progress bar -->
        <q-linear-progress
          :value="store.answeredCount / Math.max(store.totalQuestions, 1)"
          color="amber"
          class="q-mt-sm"
          rounded
          size="8px"
        />
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner-gears color="amber" size="48px" />
        <div class="q-mt-md text-grey-7">{{ lang === 'af' ? 'Laai toets...' : 'Loading test...' }}</div>
      </div>

      <!-- Question Grid -->
      <q-card v-else-if="template" flat class="bee-card q-pa-md q-mb-md">
        <MathQuestionGrid
          :questions="template.questions"
          :answers="answersMap"
          :disabled="!store.testActive"
          @answer="handleAnswer"
        />
      </q-card>

      <!-- Done Button -->
      <div v-if="store.testActive" class="text-center q-mt-md">
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
import MathQuestionGrid from 'src/components/MathQuestionGrid.vue'

const { t, lang } = useI18n()
const { getTemplate, submitAttempt } = useMathTest()
const store = useMathTestStore()
const route = useRoute()
const router = useRouter()

const template = ref<any>(null)
const loading = ref(true)
const submitting = ref(false)
const error = ref('')

const answersMap = computed(() => {
  const map = new Map<number, number>()
  for (const a of store.answers) {
    map.set(a.questionIndex, a.givenAnswer)
  }
  return map
})

function handleAnswer(index: number, value: number) {
  if (store.testActive) {
    store.answerQuestion(index, value)
  }
}

async function handleFinish() {
  store.finishTest()
  await submitTest()
}

function handleTimeUp() {
  store.finishTest()
  submitTest()
}

async function submitTest() {
  if (submitting.value) return
  submitting.value = true

  try {
    const childId = route.query.childId ? Number(route.query.childId) : undefined
    const result = await submitAttempt(template.value.id, {
      playerName: store.playerName,
      answers: store.answers,
      timeUsedSec: store.getTimeUsedSec(),
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

onMounted(async () => {
  const templateId = Number(route.params.templateId)
  if (isNaN(templateId)) {
    error.value = 'Invalid test ID'
    loading.value = false
    return
  }

  try {
    template.value = await getTemplate(templateId)
    store.startTest(template.value)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load test'
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  // Don't reset if navigating to results
  if (!submitting.value && store.testActive) {
    store.finishTest()
  }
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
@media (max-width: 768px) {
  .test-header {
    top: 0;
    padding: 6px 10px;
    border-radius: 0;
    margin: -16px -16px 8px;
    width: calc(100% + 32px);
  }
  .test-header h2 {
    font-size: 14px !important;
  }
}
</style>
