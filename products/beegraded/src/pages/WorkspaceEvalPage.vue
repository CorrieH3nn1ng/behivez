<template>
  <q-page class="honeycomb-bg">
    <div class="page-container" style="max-width: 640px;">
      <q-btn flat no-caps icon="arrow_back" label="Back to Workspace" color="grey-7" to="/workspace" class="q-mb-md" />

      <div class="row items-center q-mb-md">
        <div>
          <h2 class="text-h5 text-weight-bold q-mb-none">
            <q-icon name="hive" color="amber" class="q-mr-sm" />
            Evaluation
          </h2>
          <div class="text-caption text-grey-6">{{ evalSession.session?.id }}</div>
        </div>
        <q-space />
        <q-badge :color="stepBadgeColor" :label="stepBadgeLabel" class="q-pa-sm" />
      </div>

      <!-- Progress stepper -->
      <div class="row q-gutter-sm q-mb-lg">
        <div v-for="s in 3" :key="s" class="col">
          <div
            class="text-center q-pa-xs rounded-borders"
            :style="{
              background: evalSession.currentStep >= s ? '#f59e0b' : '#374151',
              color: evalSession.currentStep >= s ? '#1c1917' : '#9ca3af',
              fontSize: '12px',
              fontWeight: evalSession.currentStep >= s ? '700' : '400',
            }"
          >
            {{ s === 1 ? 'Rubric' : s === 2 ? 'Draft' : 'Final' }}
          </div>
        </div>
      </div>

      <!-- Step Cards -->
      <div class="q-gutter-md">
        <!-- Step 1: Rubric -->
        <q-card flat class="bee-card q-pa-lg" :class="evalSession.currentStep === 1 ? 'step-active-card' : ''">
          <div class="row items-center q-mb-sm">
            <q-icon :name="evalSession.hasRubric ? 'check_circle' : 'upload_file'" :color="evalSession.hasRubric ? 'positive' : 'amber'" size="28px" class="q-mr-sm" />
            <div class="text-weight-bold">1. Upload Your Rubric PDF</div>
          </div>
          <p class="text-grey-7 text-caption q-mb-sm">Upload the rubric PDF from your lecturer. Our AI will extract questions, marks, and criteria.</p>
          <template v-if="evalSession.hasRubric && evalSession.session?.rubric">
            <div class="q-pa-sm bg-green-1 rounded-borders q-mb-sm">
              <q-icon name="check" color="positive" size="14px" class="q-mr-xs" />
              {{ evalSession.session.rubric.questions?.length || 0 }} questions, {{ evalSession.session.rubric.total_marks }} marks — {{ evalSession.session.rubric.module_name || 'Confirmed' }}
            </div>
          </template>
          <q-btn
            v-if="evalSession.currentStep === 1"
            class="btn-bee"
            no-caps
            :label="evalSession.hasRubric ? 'Re-upload Rubric' : 'Upload Rubric'"
            icon="upload_file"
            to="/workspace/new/rubric"
          />
        </q-card>

        <!-- Step 2: Draft -->
        <q-card flat class="bee-card q-pa-lg" :class="evalSession.currentStep === 2 ? 'step-active-card' : ''">
          <div class="row items-center q-mb-sm">
            <q-icon :name="evalSession.hasDraftEval ? 'check_circle' : 'description'" :color="evalSession.hasDraftEval ? 'positive' : (evalSession.currentStep >= 2 ? 'amber' : 'grey-4')" size="28px" class="q-mr-sm" />
            <div class="text-weight-bold" :class="evalSession.currentStep < 2 ? 'text-grey-5' : ''">2. Upload Draft Paper</div>
          </div>
          <p class="text-grey-7 text-caption q-mb-sm">Upload your .docx draft. We'll evaluate it against your rubric.</p>
          <template v-if="evalSession.session?.draft_evaluation_id">
            <div class="q-pa-sm bg-green-1 rounded-borders q-mb-sm">
              <q-icon name="check" color="positive" size="14px" class="q-mr-xs" />
              Draft evaluated —
              <q-btn flat dense no-caps color="amber-8" label="View Report" size="sm" :to="`/workspace/report/${evalSession.session.draft_evaluation_id}`" />
            </div>
          </template>
          <q-btn
            v-if="evalSession.currentStep === 2"
            class="btn-bee"
            no-caps
            label="Upload Draft"
            icon="upload_file"
            to="/workspace/new/upload"
          />
        </q-card>

        <!-- Step 3: Final -->
        <q-card flat class="bee-card q-pa-lg" :class="evalSession.currentStep === 3 ? 'step-active-card' : ''">
          <div class="row items-center q-mb-sm">
            <q-icon :name="evalSession.hasFinalEval ? 'check_circle' : 'upgrade'" :color="evalSession.hasFinalEval ? 'positive' : (evalSession.currentStep >= 3 ? 'amber' : 'grey-4')" size="28px" class="q-mr-sm" />
            <div class="text-weight-bold" :class="evalSession.currentStep < 3 ? 'text-grey-5' : ''">3. Upload Final Version</div>
          </div>
          <p class="text-grey-7 text-caption q-mb-sm">Upload your revised paper to see your improvement and get a comparison report.</p>
          <template v-if="evalSession.session?.final_evaluation_id">
            <div class="q-pa-sm bg-green-1 rounded-borders q-mb-sm">
              <q-icon name="check" color="positive" size="14px" class="q-mr-xs" />
              Final evaluated —
              <q-btn flat dense no-caps color="amber-8" label="View Report" size="sm" :to="`/workspace/report/${evalSession.session.final_evaluation_id}`" />
              <q-btn
                v-if="evalSession.session.draft_evaluation_id"
                flat dense no-caps color="blue-7" label="Compare" size="sm" class="q-ml-sm"
                :to="`/workspace/comparison/${evalSession.session.draft_evaluation_id}/${evalSession.session.final_evaluation_id}`"
              />
            </div>
          </template>
          <q-btn
            v-if="evalSession.currentStep === 3"
            class="btn-bee"
            no-caps
            label="Upload Final Version"
            icon="upgrade"
            to="/workspace/new/final"
          />
        </q-card>
      </div>

      <!-- Post-completion -->
      <q-card v-if="evalSession.currentStep >= 4" flat class="bee-card q-pa-lg text-center q-mt-lg">
        <q-icon name="celebration" size="40px" color="amber" class="q-mb-sm" />
        <div class="text-h6 text-weight-bold q-mb-xs">Evaluation Complete!</div>
        <p class="text-grey-7 q-mb-md">Your draft and final papers have been evaluated. View the comparison to see your improvement.</p>
        <div class="row q-gutter-md justify-center">
          <q-btn
            v-if="evalSession.session?.draft_evaluation_id && evalSession.session?.final_evaluation_id"
            class="btn-bee"
            no-caps
            label="View Comparison"
            icon="compare"
            :to="`/workspace/comparison/${evalSession.session.draft_evaluation_id}/${evalSession.session.final_evaluation_id}`"
          />
          <q-btn outline color="amber-8" no-caps label="Start New Evaluation" icon="add" @click="startFresh" />
        </div>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useEvalSessionStore } from 'src/stores/evaluation-session'

const evalSession = useEvalSessionStore()
const router = useRouter()

const stepBadgeColor = computed(() => {
  if (evalSession.currentStep >= 4) return 'positive'
  return 'amber'
})

const stepBadgeLabel = computed(() => {
  const s = evalSession.currentStep
  if (s === 1) return 'Step 1: Rubric'
  if (s === 2) return 'Step 2: Draft'
  if (s === 3) return 'Step 3: Final'
  return 'Complete'
})

function startFresh() {
  evalSession.startNew()
  router.push('/workspace/new')
}

onMounted(() => {
  // If no session exists, create one
  if (!evalSession.session) {
    evalSession.startNew()
  }
})
</script>

<style scoped>
.step-active-card {
  border: 2px solid #f59e0b;
}
</style>
