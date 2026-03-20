<template>
  <q-page class="honeycomb-bg">
    <div class="page-container" style="max-width: 640px;">
      <q-btn v-if="isWorkspace" flat no-caps icon="arrow_back" label="Back to Workspace" color="grey-7" to="/workspace" class="q-mb-sm" />

      <h2 class="text-h5 text-weight-bold q-mb-xs">
        <q-icon name="upload_file" color="amber" class="q-mr-sm" />
        {{ isFinalMode ? 'Upload Final Version' : 'Upload Your Paper' }}
      </h2>
      <p class="text-grey-7 q-mb-lg" style="font-size: 14px;">
        {{ isFinalMode ? 'Upload the revised final version of your paper.' : 'Upload a .docx or .pdf file, fill in the details, and get your evaluation report.' }}
      </p>

      <q-card flat class="bee-card q-pa-lg">
        <!-- Draft / Final toggle (workspace only) -->
        <div v-if="isWorkspace && !isFinalMode" class="q-mb-md">
          <div class="text-weight-bold q-mb-sm">Paper Type</div>
          <q-btn-toggle
            v-model="draftOrFinal"
            no-caps
            rounded
            toggle-color="amber"
            :options="[
              { label: 'Draft', value: 'draft' },
              { label: 'Final', value: 'final' },
            ]"
            :disable="evaluating"
          />
        </div>

        <!-- File Upload -->
        <q-file
          v-model="file"
          outlined
          label="Select .docx or .pdf file"
          accept=".docx,.pdf,.doc"
          class="q-mb-md"
          :rules="[val => !!val || 'File required']"
          :disable="evaluating"
        >
          <template #prepend><q-icon name="attach_file" /></template>
        </q-file>

        <!-- Paper Details -->
        <q-input v-model="subject" outlined label="Subject Name" class="q-mb-md" :rules="[val => !!val || 'Required']" :disable="evaluating || isFinalMode">
          <template #prepend><q-icon name="book" /></template>
        </q-input>

        <q-select
          v-model="assessmentType"
          outlined
          label="Assessment Type"
          :options="assessmentOptions"
          class="q-mb-md"
          :disable="evaluating || isFinalMode"
        >
          <template #prepend><q-icon name="assignment" /></template>
        </q-select>

        <q-input v-model.number="numQuestions" outlined label="Number of Questions" type="number" min="1" max="20" class="q-mb-lg" :disable="evaluating">
          <template #prepend><q-icon name="quiz" /></template>
        </q-input>

        <!-- Mode Selection -->
        <div class="text-weight-bold q-mb-sm">Evaluation Mode</div>
        <div class="row q-gutter-md q-mb-lg">
          <q-card
            flat
            class="col cursor-pointer q-pa-md"
            :class="mode === 'A' ? 'bg-blue-1 selected-mode' : 'bg-grey-1'"
            style="border-radius: 12px; border: 2px solid transparent;"
            :style="mode === 'A' ? 'border-color: #3b82f6;' : ''"
            @click="!evaluating && (mode = 'A')"
          >
            <q-icon name="school" :color="mode === 'A' ? 'blue' : 'grey'" size="24px" class="q-mb-sm" />
            <div class="text-weight-bold" style="font-size: 14px;">Mode A</div>
            <div class="text-caption text-grey-7">Academic Quality</div>
          </q-card>
          <q-card
            flat
            class="col cursor-pointer q-pa-md"
            :class="mode === 'B' ? 'bg-red-1 selected-mode' : 'bg-grey-1'"
            style="border-radius: 12px; border: 2px solid transparent;"
            :style="mode === 'B' ? 'border-color: #ef4444;' : ''"
            @click="!evaluating && (mode = 'B')"
          >
            <q-icon name="shield" :color="mode === 'B' ? 'red' : 'grey'" size="24px" class="q-mb-sm" />
            <div class="text-weight-bold" style="font-size: 14px;">Mode B</div>
            <div class="text-caption text-grey-7">Full Turnitin Ready</div>
          </q-card>
        </div>

        <!-- Submit -->
        <q-btn
          class="btn-bee full-width"
          size="lg"
          no-caps
          :label="isWorkspace ? (uploading ? 'Uploading...' : 'Upload Paper') : (evaluating ? 'Evaluating...' : 'Evaluate Paper')"
          :disable="!isValid || evaluating || uploading"
          :loading="uploading"
          @click="isWorkspace ? handleWorkspaceUpload() : handleQuickEvaluate()"
        />

        <!-- Rubric customization link (shown after upload in workspace) -->
        <div v-if="uploadedPaperId && isWorkspace" class="text-center q-mt-md">
          <q-btn flat no-caps color="amber-8" icon="tune" label="Customize Rubric Weights" :to="`/workspace/rubric/${uploadedPaperId}?mode=${mode}`" />
        </div>
      </q-card>

      <!-- Coupon badge -->
      <div v-if="couponStore.isValid && isWorkspace" class="text-center q-mt-md">
        <q-badge color="green" class="q-pa-sm" style="font-size: 12px;">
          <q-icon name="redeem" size="14px" class="q-mr-xs" />
          {{ couponStore.discount_percent === 100 ? 'Free evaluation' : `${couponStore.discount_percent}% off` }}
          via {{ couponStore.affiliate_name }}
        </q-badge>
      </div>

      <!-- Evaluation Loading Overlay (anonymous mode only) -->
      <q-dialog v-model="evaluating" persistent seamless position="standard">
        <q-card class="bee-card text-center q-pa-xl" style="min-width: 340px; background: #1c1917;">
          <q-spinner-bee size="64px" color="amber" class="q-mb-md" />
          <div class="text-h6 text-amber q-mb-sm">Evaluating Your Paper</div>
          <div class="text-grey-6 q-mb-md" style="font-size: 13px;">
            {{ statusMessage }}
          </div>
          <q-linear-progress :value="fakeProgress / 100" color="amber" class="q-mb-sm" style="border-radius: 8px;" />
          <div class="text-grey-8" style="font-size: 11px;">{{ fakeProgress }}% &mdash; This takes 60-90 seconds</div>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEvaluation } from 'src/composables/useEvaluation'
import { useCouponStore } from 'src/stores/coupon'
import { Notify } from 'quasar'

const props = defineProps<{ paperId?: string }>()
const route = useRoute()
const router = useRouter()
const couponStore = useCouponStore()
const { quickEvaluate, uploadPaper, uploading, uploadProgress, evaluating } = useEvaluation()

const isWorkspace = computed(() => route.path.startsWith('/workspace'))
const isFinalMode = computed(() => route.name === 'workspace-upload-final')

const file = ref<File | null>(null)
const subject = ref('')
const assessmentType = ref('Summative Assessment')
const numQuestions = ref(4)
const mode = ref<'A' | 'B'>('A')
const draftOrFinal = ref<'draft' | 'final'>('draft')
const fakeProgress = ref(0)
const statusMessage = ref('Uploading and extracting text...')
const uploadedPaperId = ref<number | null>(null)

const assessmentOptions = [
  'Summative Assessment',
  'Formative Assessment',
  'Essay',
  'Research Paper',
  'Case Study',
  'Portfolio',
  'Dissertation Chapter',
  'Other',
]

const isValid = computed(() => file.value && subject.value && assessmentType.value)

let progressTimer: ReturnType<typeof setInterval> | null = null

const statusMessages = [
  { at: 0, msg: 'Uploading and extracting text...' },
  { at: 15, msg: 'Text extracted. Building evaluation prompt...' },
  { at: 25, msg: 'Sending to AI for evaluation...' },
  { at: 40, msg: 'AI is reading your paper...' },
  { at: 55, msg: 'Analysing critical thinking and references...' },
  { at: 70, msg: 'Checking citations against bibliography...' },
  { at: 85, msg: 'Building your report...' },
  { at: 95, msg: 'Almost done...' },
]

// If final mode, pre-fill from route params
onMounted(() => {
  if (isFinalMode.value) {
    draftOrFinal.value = 'final'
    // Subject/assessment might come from query params (set by PaperCard or workspace)
    if (route.query.subject) subject.value = route.query.subject as string
    if (route.query.assessment) assessmentType.value = route.query.assessment as string
  }
})

function startFakeProgress() {
  fakeProgress.value = 0
  statusMessage.value = statusMessages[0].msg
  progressTimer = setInterval(() => {
    if (fakeProgress.value < 95) {
      fakeProgress.value += Math.random() * 3 + 1
      if (fakeProgress.value > 95) fakeProgress.value = 95
      const current = statusMessages.filter(s => s.at <= fakeProgress.value).pop()
      if (current) statusMessage.value = current.msg
    }
  }, 1200)
}

function stopFakeProgress() {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
  fakeProgress.value = 100
}

onUnmounted(() => {
  if (progressTimer) clearInterval(progressTimer)
})

// Anonymous quick evaluate (non-workspace)
async function handleQuickEvaluate() {
  if (!file.value || !isValid.value) return

  startFakeProgress()
  try {
    const result = await quickEvaluate(file.value, subject.value, assessmentType.value, numQuestions.value, mode.value)
    stopFakeProgress()

    if (result.report_html) {
      sessionStorage.setItem('beegraded_report', result.report_html)
      sessionStorage.setItem('beegraded_subject', subject.value)
      router.push({ name: 'report' })
    } else {
      Notify.create({ type: 'negative', message: 'No report returned. Please try again.' })
    }
  } catch (err: unknown) {
    stopFakeProgress()
    const msg = err instanceof Error ? err.message : 'Evaluation failed'
    Notify.create({ type: 'negative', message: msg })
  }
}

// Workspace upload flow: upload → payment/rubric/processing
async function handleWorkspaceUpload() {
  if (!file.value || !isValid.value) return

  try {
    const linkedPaperId = isFinalMode.value && props.paperId ? Number(props.paperId) : undefined
    const type = isFinalMode.value ? 'final' : draftOrFinal.value

    const result = await uploadPaper(file.value, subject.value, assessmentType.value, numQuestions.value, type, linkedPaperId)
    const pid = result.paper_id
    uploadedPaperId.value = pid

    // If coupon gives 100% discount, skip payment
    if (couponStore.isFreePass) {
      Notify.create({ type: 'positive', message: 'Coupon applied — free evaluation!', icon: 'redeem' })
      router.push({
        path: `/workspace/processing/${pid}`,
        query: { mode: mode.value, test: '1', coupon: couponStore.code },
      })
      return
    }

    // Route to payment
    router.push({
      name: 'workspace-payment',
      params: { paperId: String(pid) },
      query: { mode: mode.value },
    })
  } catch {
    Notify.create({ type: 'negative', message: 'Upload failed. Please try again.' })
  }
}
</script>
