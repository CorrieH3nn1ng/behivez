<template>
  <q-page class="report-page-bg">
    <!-- Action bar -->
    <div class="report-action-bar">
      <q-btn v-if="isToken" flat no-caps icon="arrow_back" label="Back to Token Hub" color="grey-7" :to="`/t/${tokenCode}`" />
      <q-btn v-else-if="isWorkspace" flat no-caps icon="arrow_back" label="Back to Workspace" color="grey-7" to="/workspace" />
      <q-btn v-else-if="isFreeSample" flat no-caps icon="arrow_back" label="Home" color="grey-7" to="/" />
      <q-btn v-else flat no-caps icon="arrow_back" label="Home" color="grey-7" to="/" />
      <q-space />
      <template v-if="!isTeaser && evalData">
        <q-btn outline no-caps icon="print" label="Print" color="grey-7" @click="printReport" />
      </template>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center q-pa-xl">
      <q-spinner-gears size="48px" color="amber" />
      <p class="text-grey-7 q-mt-md">Loading your report...</p>
    </div>

    <!-- No data -->
    <div v-else-if="!evalData" class="text-center q-pa-xl">
      <q-icon name="description" size="48px" color="amber" />
      <p class="text-grey-7 q-mt-md">No report available. Upload a paper first.</p>
      <q-btn class="btn-bee q-mt-md" no-caps label="Upload Paper" :to="isWorkspace ? '/workspace/new/upload' : '/free-sample'" />
    </div>

    <!-- Report content -->
    <template v-else>
      <!-- Teaser: show limited info with blur overlay -->
      <div v-if="isTeaser" class="report-teaser page-container q-pt-lg">
        <div class="teaser-content">
          <!-- Only show overall score + paper info for teaser -->
          <ReportHeader :eval="evalData.evaluation" />
          <div class="row justify-center q-mt-lg">
            <ScoreGauge :score="evalData.evaluation.overall_score" label="Overall" :size="160" />
          </div>
        </div>
        <div class="blur-overlay">
          <div class="blur-cta-card text-center q-pa-xl">
            <q-icon name="lock" size="48px" color="amber" class="q-mb-md" />
            <h3 class="text-h5 text-weight-bold q-mb-sm">Want the full report?</h3>
            <p class="text-grey-7 q-mb-md" style="max-width: 360px; margin: 0 auto;">
              Your full evaluation includes detailed per-question feedback, fix list,
              before/after examples, and reference audit.
            </p>
            <q-btn class="btn-bee" size="lg" no-caps label="Unlock Full Report — Buy Token R25" icon="hive" to="/buy-token" />
            <div class="q-mt-sm">
              <q-btn flat no-caps color="grey-6" label="Or create an account — R20/eval" to="/get-started" size="sm" />
            </div>
          </div>
        </div>
      </div>

      <!-- Full report -->
      <div v-else class="page-container q-py-lg">
        <!-- Header: paper info -->
        <ReportHeader :eval="evalData.evaluation" />

        <!-- Overall score -->
        <div class="row justify-center q-my-lg">
          <ScoreGauge :score="evalData.evaluation.overall_score" label="Overall" :size="160" />
        </div>

        <!-- Category scores -->
        <q-card flat class="bee-card q-pa-lg q-mb-lg">
          <div class="text-h6 text-weight-bold q-mb-md">Score Breakdown</div>
          <div class="row q-gutter-md justify-center">
            <ScoreGauge :score="evalData.evaluation.knowledge_score" label="Knowledge" />
            <ScoreGauge :score="evalData.evaluation.critical_score" label="Critical" />
            <ScoreGauge :score="evalData.evaluation.application_score" label="Application" />
            <ScoreGauge :score="evalData.evaluation.referencing_score" label="Referencing" />
            <ScoreGauge :score="evalData.evaluation.structure_score" label="Structure" />
            <ScoreGauge v-if="evalData.evaluation.ai_risk_score !== null" :score="evalData.evaluation.ai_risk_score" label="AI Risk" />
          </div>
        </q-card>

        <!-- Distinction Guide (80%+ overall) -->
        <DistinctionGuide :eval="evalData.evaluation" :evaluation-id="evalData.evaluation.id" />

        <!-- Issues (fix list) -->
        <q-card v-if="evalData.issues.length" flat class="bee-card q-pa-lg q-mb-lg">
          <div class="text-h6 text-weight-bold q-mb-md">
            <q-icon name="build" color="amber" class="q-mr-sm" />
            Fix List
          </div>
          <IssuesList :issues="evalData.issues" />

          <!-- Before/After examples from issues -->
          <div v-if="beforeAfterExamples.length" class="q-mt-lg">
            <div class="text-subtitle1 text-weight-bold q-mb-md">
              <q-icon name="auto_fix_high" color="purple" class="q-mr-sm" />
              Before &amp; After Examples
            </div>
            <BeforeAfterCard
              v-for="ex in beforeAfterExamples"
              :key="ex.id"
              :title="ex.category"
              :before="ex.example_before!"
              :after="ex.example_after!"
            />
          </div>
        </q-card>

        <!-- Strengths -->
        <q-card v-if="evalData.strengths.length" flat class="bee-card q-pa-lg q-mb-lg">
          <div class="text-h6 text-weight-bold q-mb-md">
            <q-icon name="emoji_events" color="positive" class="q-mr-sm" />
            What You Did Well
          </div>
          <StrengthsList :strengths="evalData.strengths" />
        </q-card>

        <!-- Reference Audit -->
        <q-card v-if="evalData.references.length" flat class="bee-card q-pa-lg q-mb-lg">
          <div class="text-h6 text-weight-bold q-mb-md">
            <q-icon name="menu_book" color="blue" class="q-mr-sm" />
            Reference Audit
          </div>
          <ReferenceAuditTable :references="evalData.references" />
        </q-card>

        <!-- Consistency Checks -->
        <q-card v-if="evalData.consistency.length" flat class="bee-card q-pa-lg q-mb-lg">
          <div class="text-h6 text-weight-bold q-mb-md">
            <q-icon name="fact_check" color="orange" class="q-mr-sm" />
            Consistency Checks
          </div>
          <q-list bordered separator class="rounded-borders">
            <q-item v-for="check in evalData.consistency" :key="check.id">
              <q-item-section avatar>
                <q-icon :name="check.status === 'pass' ? 'check_circle' : 'warning'" :color="check.status === 'pass' ? 'positive' : 'warning'" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold">{{ check.check_type }}</q-item-label>
                <q-item-label caption>{{ check.detail }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <!-- Post-report CTAs -->
      <div v-if="!isTeaser" class="report-cta-bar">
        <q-card v-if="(isToken || isWorkspace) && isDraft" flat class="bee-card q-pa-lg text-center q-mb-md">
          <q-icon name="upgrade" size="32px" color="green" class="q-mb-sm" />
          <div class="text-weight-bold q-mb-xs">Ready to submit your final version?</div>
          <div class="text-caption text-grey-7 q-mb-md">Upload your revised paper to track your improvement.</div>
          <q-btn v-if="isToken" class="btn-bee" no-caps label="Upload Final Version" icon="upload_file" :to="`/t/${tokenCode}/final`" />
          <q-btn v-else class="btn-bee" no-caps label="Upload Final Version" icon="upload_file" to="/workspace/new/final" />
        </q-card>

        <q-card v-if="isToken" flat class="bee-card q-pa-lg text-center">
          <q-icon name="hive" size="32px" color="amber" class="q-mb-sm" />
          <div class="text-weight-bold q-mb-xs">Save this report to your workspace</div>
          <div class="text-caption text-grey-7 q-mb-md">Create an account to keep all your reports, reuse rubrics, and get evaluations at R20.</div>
          <q-btn class="btn-bee" no-caps label="Create Account" to="/get-started" icon="person_add" />
        </q-card>
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useEvaluation } from 'src/composables/useEvaluation'
import ScoreGauge from 'src/components/ScoreGauge.vue'
import IssuesList from 'src/components/IssuesList.vue'
import StrengthsList from 'src/components/StrengthsList.vue'
import ReferenceAuditTable from 'src/components/ReferenceAuditTable.vue'
import BeforeAfterCard from 'src/components/BeforeAfterCard.vue'
import ReportHeader from 'src/components/ReportHeader.vue'
import DistinctionGuide from 'src/components/DistinctionGuide.vue'

const props = defineProps<{
  evaluationId?: string
  sampleId?: string
}>()
const route = useRoute()
const { getEvaluationDetail } = useEvaluation()

type EvalDetail = Awaited<ReturnType<typeof getEvaluationDetail>>

const evalData = ref<EvalDetail | null>(null)
const loading = ref(false)

const isWorkspace = computed(() => route.path.startsWith('/workspace'))
const isToken = computed(() => route.path.startsWith('/t/'))
const isFreeSample = computed(() => route.path.startsWith('/free-sample'))
const isTeaser = computed(() => isFreeSample.value)
const tokenCode = computed(() => route.params.tokenCode as string || '')
const isDraft = computed(() => evalData.value?.evaluation?.draft_or_final === 'draft')

const beforeAfterExamples = computed(() =>
  (evalData.value?.issues || []).filter(i => i.example_before && i.example_after)
)

onMounted(async () => {
  const evalId = props.evaluationId || props.sampleId
  if (!evalId) return

  loading.value = true
  try {
    const data = await getEvaluationDetail(Number(evalId))
    if (data.evaluation) {
      evalData.value = data
    }
  } catch (err) {
    console.error('Failed to load evaluation:', err)
  } finally {
    loading.value = false
  }
})

function printReport() {
  window.print()
}
</script>

<style scoped>
.report-page-bg {
  background: #fefce8;
  min-height: 100vh;
}
.report-action-bar {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: #1c1917;
  border-bottom: 1px solid #292524;
}
.report-action-bar :deep(.q-btn) {
  color: #94a3b8;
}
.page-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 16px;
}
.report-cta-bar {
  max-width: 640px;
  margin: 24px auto;
  padding: 0 16px;
}
.report-teaser {
  position: relative;
  overflow: hidden;
}
.teaser-content {
  max-height: 500px;
  overflow: hidden;
}
.blur-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 400px;
  background: linear-gradient(
    to bottom,
    rgba(254, 252, 232, 0) 0%,
    rgba(254, 252, 232, 0.7) 30%,
    rgba(254, 252, 232, 0.95) 60%,
    rgba(254, 252, 232, 1) 100%
  );
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 32px;
}
.blur-cta-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  max-width: 440px;
  width: 100%;
}

@media print {
  .report-action-bar,
  .report-cta-bar {
    display: none !important;
  }
}
</style>
