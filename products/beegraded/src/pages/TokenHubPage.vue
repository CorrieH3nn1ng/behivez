<template>
  <q-page class="honeycomb-bg">
    <div class="page-container" style="max-width: 640px;">
      <!-- Loading -->
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner-gears size="48px" color="amber" />
        <p class="text-grey-7 q-mt-md">Validating your token...</p>
      </div>

      <!-- Invalid token -->
      <div v-else-if="!tokenStore.isValid" class="text-center q-pa-xl">
        <q-icon name="error" size="56px" color="negative" class="q-mb-md" />
        <h2 class="text-h5 text-weight-bold q-mb-sm">Invalid or Expired Token</h2>
        <p class="text-grey-7 q-mb-lg">This token code doesn't exist or has expired.</p>
        <q-btn class="btn-bee" no-caps label="Buy a New Token" to="/buy-token" icon="token" />
      </div>

      <!-- Valid token -->
      <template v-else>
        <div class="row items-center q-mb-md">
          <div>
            <h2 class="text-h5 text-weight-bold q-mb-none">
              <q-icon name="hive" color="amber" class="q-mr-sm" />
              Token Hub
            </h2>
            <div class="text-caption text-grey-6">{{ tokenStore.tokenCode }} &middot; {{ tokenStore.tokenData?.email }}</div>
          </div>
          <q-space />
          <q-badge :color="statusColor" :label="statusLabel" class="q-pa-sm" />
        </div>

        <!-- Stepper -->
        <TokenProgressStepper :current-step="tokenStore.currentStep" />

        <!-- Step Cards -->
        <div class="q-gutter-md">
          <!-- Step 1: Rubric -->
          <q-card flat class="bee-card q-pa-lg" :class="tokenStore.currentStep === 1 ? 'step-active-card' : ''">
            <div class="row items-center q-mb-sm">
              <q-icon :name="tokenStore.hasRubric ? 'check_circle' : 'upload_file'" :color="tokenStore.hasRubric ? 'positive' : 'amber'" size="28px" class="q-mr-sm" />
              <div class="text-weight-bold">1. Upload Your Rubric PDF</div>
            </div>
            <p class="text-grey-7 text-caption q-mb-sm">Upload the rubric PDF from your lecturer. Our AI will extract questions, marks, and criteria.</p>
            <template v-if="tokenStore.hasRubric && tokenStore.rubric">
              <div class="q-pa-sm bg-green-1 rounded-borders q-mb-sm">
                <q-icon name="check" color="positive" size="14px" class="q-mr-xs" />
                {{ tokenStore.rubric.questions?.length || 0 }} questions, {{ tokenStore.rubric.total_marks }} marks — {{ tokenStore.rubric.module_name || 'Confirmed' }}
              </div>
            </template>
            <q-btn
              v-if="tokenStore.currentStep === 1"
              class="btn-bee"
              no-caps
              :label="tokenStore.hasRubric ? 'Re-upload Rubric' : 'Upload Rubric'"
              icon="upload_file"
              :to="`/t/${tokenCode}/rubric`"
            />
          </q-card>

          <!-- Step 2: Draft -->
          <q-card flat class="bee-card q-pa-lg" :class="tokenStore.currentStep === 2 ? 'step-active-card' : ''">
            <div class="row items-center q-mb-sm">
              <q-icon :name="tokenStore.hasDraft ? 'check_circle' : 'description'" :color="tokenStore.hasDraft ? 'positive' : (tokenStore.currentStep >= 2 ? 'amber' : 'grey-4')" size="28px" class="q-mr-sm" />
              <div class="text-weight-bold" :class="tokenStore.currentStep < 2 ? 'text-grey-5' : ''">2. Upload Draft Paper</div>
            </div>
            <p class="text-grey-7 text-caption q-mb-sm">Upload your .docx draft. We'll evaluate it against your rubric.</p>
            <template v-if="tokenStore.tokenData?.draft_evaluation_id">
              <div class="q-pa-sm bg-green-1 rounded-borders q-mb-sm">
                <q-icon name="check" color="positive" size="14px" class="q-mr-xs" />
                Draft evaluated —
                <q-btn flat dense no-caps color="amber-8" label="View Report" size="sm" :to="`/t/${tokenCode}/report/${tokenStore.tokenData.draft_evaluation_id}`" />
              </div>
            </template>
            <q-btn
              v-if="tokenStore.currentStep === 2"
              class="btn-bee"
              no-caps
              label="Upload Draft"
              icon="upload_file"
              :to="`/t/${tokenCode}/upload`"
            />
          </q-card>

          <!-- Step 3: Final -->
          <q-card flat class="bee-card q-pa-lg" :class="tokenStore.currentStep === 3 ? 'step-active-card' : ''">
            <div class="row items-center q-mb-sm">
              <q-icon :name="tokenStore.hasFinal ? 'check_circle' : 'upgrade'" :color="tokenStore.hasFinal ? 'positive' : (tokenStore.currentStep >= 3 ? 'amber' : 'grey-4')" size="28px" class="q-mr-sm" />
              <div class="text-weight-bold" :class="tokenStore.currentStep < 3 ? 'text-grey-5' : ''">3. Upload Final Version</div>
            </div>
            <p class="text-grey-7 text-caption q-mb-sm">Upload your revised paper to see your improvement and get a comparison report.</p>
            <template v-if="tokenStore.tokenData?.final_evaluation_id">
              <div class="q-pa-sm bg-green-1 rounded-borders q-mb-sm">
                <q-icon name="check" color="positive" size="14px" class="q-mr-xs" />
                Final evaluated —
                <q-btn flat dense no-caps color="amber-8" label="View Report" size="sm" :to="`/t/${tokenCode}/report/${tokenStore.tokenData.final_evaluation_id}`" />
                <q-btn
                  v-if="tokenStore.tokenData.draft_evaluation_id"
                  flat dense no-caps color="blue-7" label="Compare" size="sm" class="q-ml-sm"
                  :to="`/t/${tokenCode}/comparison/${tokenStore.tokenData.draft_evaluation_id}/${tokenStore.tokenData.final_evaluation_id}`"
                />
              </div>
            </template>
            <q-btn
              v-if="tokenStore.currentStep === 3"
              class="btn-bee"
              no-caps
              label="Upload Final Version"
              icon="upgrade"
              :to="`/t/${tokenCode}/final`"
            />
          </q-card>
        </div>

        <!-- Post-completion CTA -->
        <q-card v-if="tokenStore.currentStep >= 4" flat class="bee-card q-pa-lg text-center q-mt-lg">
          <q-icon name="celebration" size="40px" color="amber" class="q-mb-sm" />
          <div class="text-h6 text-weight-bold q-mb-xs">Token Complete!</div>
          <p class="text-grey-7 q-mb-md">Create an account to save your work, reuse rubrics, and get future evaluations at R20.</p>
          <q-btn class="btn-bee" no-caps label="Create Account" to="/get-started" icon="person_add" />
        </q-card>
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTokenStore } from 'src/stores/token'
import { useToken } from 'src/composables/useToken'
import TokenProgressStepper from 'src/components/TokenProgressStepper.vue'

const props = defineProps<{ tokenCode: string }>()
const tokenStore = useTokenStore()
const { validateToken } = useToken()
const loading = ref(true)

const statusColor = computed(() => {
  const s = tokenStore.status
  if (s === 'expired') return 'negative'
  if (s === 'final_evaluated') return 'positive'
  return 'amber'
})

const statusLabel = computed(() => {
  const s = tokenStore.status
  if (s === 'active') return 'Ready'
  if (s === 'rubric_uploaded') return 'Rubric Uploaded'
  if (s === 'draft_evaluated') return 'Draft Done'
  if (s === 'final_evaluated') return 'Complete'
  if (s === 'expired') return 'Expired'
  return 'Unknown'
})

onMounted(async () => {
  // Always re-validate on mount to get fresh data
  await validateToken(props.tokenCode)
  loading.value = false
})
</script>

<style scoped>
.step-active-card {
  border: 2px solid #f59e0b;
}
</style>
