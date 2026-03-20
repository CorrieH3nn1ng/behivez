<template>
  <q-page class="honeycomb-bg flex flex-center" style="min-height: 80vh;">
    <q-card flat class="bee-card q-pa-xl text-center" style="max-width: 480px; width: 100%;">
      <template v-if="status === 'processing'">
        <div class="bee-spinner q-mb-lg">
          <q-icon name="hive" size="56px" color="amber" class="pulse-icon" />
        </div>
        <h2 class="text-h5 text-weight-bold q-mb-xs">Evaluating Your Paper</h2>
        <p class="text-grey-7 q-mb-lg" style="font-size: 14px;">
          Our AI is reading your paper, scoring each criterion, and building your report...
        </p>

        <div class="q-mb-md">
          <q-linear-progress :value="progress / 100" color="amber" size="10px" rounded class="q-mb-xs" />
          <div class="text-caption text-grey-6">{{ progressText }}</div>
        </div>

        <q-list dense class="text-left q-mt-lg">
          <q-item v-for="step in progressSteps" :key="step.label" class="q-pa-xs">
            <q-item-section avatar>
              <q-icon
                :name="step.done ? 'check_circle' : (step.active ? 'hourglass_top' : 'radio_button_unchecked')"
                :color="step.done ? 'positive' : (step.active ? 'amber' : 'grey-4')"
                size="20px"
              />
            </q-item-section>
            <q-item-section :class="step.done ? 'text-positive' : (step.active ? 'text-weight-bold' : 'text-grey-5')">
              {{ step.label }}
            </q-item-section>
          </q-item>
        </q-list>
      </template>

      <template v-else-if="status === 'complete'">
        <q-icon name="check_circle" size="56px" color="positive" class="q-mb-md" />
        <h2 class="text-h5 text-weight-bold q-mb-xs">Report Ready!</h2>
        <p class="text-grey-7 q-mb-lg">Your evaluation is complete.</p>
        <q-btn class="btn-bee" size="lg" no-caps label="View Report" :to="reportRoute" icon="description" />
      </template>

      <template v-else-if="status === 'failed'">
        <q-icon name="error" size="56px" color="negative" class="q-mb-md" />
        <h2 class="text-h5 text-weight-bold q-mb-xs">Something Went Wrong</h2>
        <p class="text-grey-7 q-mb-lg">We couldn't process your paper. Please try again or contact support.</p>
        <q-btn class="btn-bee" no-caps label="Try Again" :to="retryRoute" />
      </template>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEvaluation } from 'src/composables/useEvaluation'
import { useEvalSessionStore } from 'src/stores/evaluation-session'

const props = defineProps<{
  paperId?: string
  sampleId?: string
  tokenCode?: string
}>()

const route = useRoute()
const router = useRouter()
const { triggerEvaluation } = useEvaluation()
const evalSessionStore = useEvalSessionStore()

const isWorkspace = computed(() => route.path.startsWith('/workspace'))
const isToken = computed(() => route.path.startsWith('/t/'))
const isFreeSample = computed(() => route.path.startsWith('/free-sample'))
const isTestMode = computed(() => route.query.test === '1')
const isEvalMode = computed(() => route.query.eval === '1')
const testMode = computed(() => (route.query.mode as string) || 'A')

const status = ref<'processing' | 'complete' | 'failed'>('processing')
const progress = ref(0)
const evaluationId = ref<number | null>(null)

const reportRoute = computed(() => {
  if (isToken.value && evaluationId.value) {
    return `/t/${props.tokenCode}/report/${evaluationId.value}`
  }
  if (isFreeSample.value && evaluationId.value) {
    return `/free-sample/report/${evaluationId.value}`
  }
  if (isWorkspace.value && evaluationId.value) {
    return `/workspace/report/${evaluationId.value}`
  }
  return `/report/${evaluationId.value}`
})

const retryRoute = computed(() => {
  if (isToken.value) return `/t/${props.tokenCode}/upload`
  if (isFreeSample.value) return '/free-sample'
  if (isEvalMode.value) return '/workspace/new'
  if (isWorkspace.value) return '/workspace/upload'
  return '/free-sample'
})

const progressSteps = computed(() => [
  { label: 'Extracting text from document', done: progress.value > 10, active: progress.value <= 10 },
  { label: 'Claude AI evaluating your paper', done: progress.value > 30, active: progress.value > 10 && progress.value <= 30 },
  { label: 'Gemini AI evaluating your paper', done: progress.value > 50, active: progress.value > 30 && progress.value <= 50 },
  { label: 'Merging scores from both models', done: progress.value > 65, active: progress.value > 50 && progress.value <= 65 },
  { label: 'Auditing references', done: progress.value > 80, active: progress.value > 65 && progress.value <= 80 },
  { label: 'Building your report', done: progress.value >= 100, active: progress.value > 80 && progress.value < 100 },
])

const progressText = computed(() => {
  if (progress.value < 20) return 'Reading your paper...'
  if (progress.value < 50) return 'Scoring criteria...'
  if (progress.value < 75) return 'Checking references...'
  if (progress.value < 95) return 'Almost there...'
  return 'Finalising report...'
})

onMounted(async () => {
  // Belt + suspenders: try props first, fall back to route.params
  const rawId = props.paperId || props.sampleId
    || route.params.paperId as string || route.params.sampleId as string
  const pid = rawId && rawId !== 'undefined' ? Number(rawId) : NaN

  if (!pid || isNaN(pid)) {
    console.error('Invalid paperId/sampleId:', props.paperId, props.sampleId, route.params)
    router.push(retryRoute.value)
    return
  }

  // Simulate visual progress
  const timer = setInterval(() => {
    if (progress.value < 95) {
      progress.value += Math.random() * 8 + 2
    }
  }, 800)

  // Trigger evaluation via backend (backend creates DB record + calls n8n for AI only)
  if (isToken.value || isTestMode.value || isEvalMode.value) {
    const rubricId = isEvalMode.value ? evalSessionStore.session?.rubric_id ?? undefined : undefined
    const isFinalUpload = route.query.final === '1'
    const draftOrFinal = isFinalUpload ? 'final' as const : 'draft' as const

    try {
      // Await full pipeline: backend record → n8n AI → backend save
      const result = await triggerEvaluation(pid, testMode.value, isToken.value ? props.tokenCode : undefined, rubricId ?? undefined, draftOrFinal)

      progress.value = 100
      status.value = 'complete'
      evaluationId.value = result.evaluation_id
      clearInterval(timer)

      if (isEvalMode.value && evalSessionStore.session) {
        if (isFinalUpload) {
          evalSessionStore.update({ final_evaluation_id: result.evaluation_id })
        } else {
          evalSessionStore.update({ draft_evaluation_id: result.evaluation_id })
        }
      }
    } catch (err) {
      console.error('Evaluate failed:', err)
      status.value = 'failed'
      clearInterval(timer)
    }
  }

  // Fallback timeout (5 minutes for dual AI — Claude + Gemini)
  setTimeout(() => {
    if (status.value === 'processing') {
      status.value = 'failed'
      clearInterval(timer)
    }
  }, 300000)
})

onUnmounted(() => {
  // cleanup if needed
})
</script>

<style scoped>
.pulse-icon {
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
}
</style>
