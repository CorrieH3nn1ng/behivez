<template>
  <q-card flat class="bee-card q-pa-lg q-mb-lg" :style="borderStyle">
    <div class="row items-center q-mb-md">
      <q-icon :name="headerIcon" size="32px" :color="headerColor" class="q-mr-sm" />
      <div class="col">
        <div class="text-h6 text-weight-bold" :class="`text-${headerColor}`">{{ headerTitle }}</div>
        <div class="text-caption text-grey-7">{{ headerSubtitle }}</div>
      </div>
      <q-btn
        v-if="!guideLoaded && !guideLoading && score < 80"
        class="btn-bee"
        no-caps
        label="Generate Rewrite Guide"
        icon="auto_fix_high"
        :loading="guideLoading"
        @click="generateGuide"
      />
      <q-btn
        v-if="guideLoaded"
        flat
        no-caps
        icon="refresh"
        label="Regenerate"
        color="grey-6"
        size="sm"
        :loading="guideLoading"
        @click="generateGuide"
      />
    </div>

    <!-- Points needed banner -->
    <q-banner v-if="score < 80" class="bg-amber-1 q-mb-md rounded-borders" dense>
      <template #avatar>
        <q-icon name="trending_up" color="amber-8" />
      </template>
      <span class="text-weight-bold">You need {{ 80 - score }} more marks to reach distinction (80%).</span>
      {{ guideLoaded ? '' : 'Click "Generate Rewrite Guide" to see exactly how to rewrite your weakest sections.' }}
    </q-banner>

    <!-- Already at distinction -->
    <q-banner v-if="score >= 80" class="bg-green-1 q-mb-md rounded-borders" dense>
      <template #avatar>
        <q-icon name="emoji_events" color="positive" />
      </template>
      <span class="text-weight-bold">You've reached distinction!</span>
      Focus on maintaining quality across all criteria.
    </q-banner>

    <!-- Loading state -->
    <div v-if="guideLoading" class="text-center q-pa-xl">
      <q-spinner-gears size="40px" color="amber" />
      <p class="text-grey-7 q-mt-md text-caption">Claude Sonnet is analysing your paper and writing rewrite examples...</p>
    </div>

    <!-- AI-Generated Improvement Examples -->
    <template v-if="guideLoaded && guide">
      <div v-if="guide.overall_advice" class="q-mb-lg">
        <q-card flat bordered class="q-pa-md bg-amber-1" style="border-radius: 10px;">
          <div class="row items-start">
            <q-icon name="lightbulb" color="amber-8" size="20px" class="q-mr-sm q-mt-xs" />
            <div class="text-body2">{{ guide.overall_advice }}</div>
          </div>
        </q-card>
      </div>

      <div class="text-weight-bold q-mb-sm" style="font-size: 15px;">
        <q-icon name="auto_fix_high" color="purple" class="q-mr-xs" />
        How to Rewrite for Distinction
      </div>

      <div class="q-gutter-md">
        <q-card
          v-for="(imp, i) in guide.improvements"
          :key="i"
          flat
          bordered
          class="q-pa-md"
          style="border-radius: 10px;"
        >
          <div class="row items-center q-mb-sm">
            <q-badge :color="criterionColor(imp.criterion)" :label="imp.criterion" />
            <span v-if="imp.current_score" class="text-caption text-grey-6 q-ml-sm">{{ imp.current_score }}%</span>
            <q-space />
            <q-badge v-if="imp.marks_impact" outline color="positive" :label="imp.marks_impact" />
          </div>

          <div v-if="imp.location" class="text-caption text-grey-6 q-mb-sm">
            <q-icon name="place" size="12px" /> {{ imp.location }}
          </div>

          <!-- Before -->
          <div class="before-after-block q-mb-sm">
            <div class="ba-label text-negative">
              <q-icon name="close" size="14px" /> Before
            </div>
            <div class="ba-text bg-red-1" style="border-left: 3px solid #ef4444;">{{ imp.before }}</div>
          </div>

          <!-- After -->
          <div class="before-after-block q-mb-sm">
            <div class="ba-label text-positive">
              <q-icon name="check" size="14px" /> After (Distinction Level)
            </div>
            <div class="ba-text bg-green-1" style="border-left: 3px solid #22c55e;">{{ imp.after }}</div>
          </div>

          <!-- Why better -->
          <div v-if="imp.why_better" class="text-caption text-grey-7" style="font-style: italic;">
            {{ imp.why_better }}
          </div>
        </q-card>
      </div>
    </template>

    <!-- Score breakdown (always shown) -->
    <div class="q-mt-lg">
      <div class="text-weight-bold q-mb-sm" style="font-size: 14px;">
        <q-icon name="bar_chart" color="amber" class="q-mr-xs" />
        Score vs Distinction Target
      </div>
      <div class="q-gutter-sm">
        <div v-for="cat in categories" :key="cat.key" class="row items-center q-mb-xs">
          <div class="col-3 text-caption text-grey-7">{{ cat.label }}</div>
          <div class="col">
            <q-linear-progress
              :value="cat.score / 100"
              :color="cat.score >= 80 ? 'positive' : cat.score >= 60 ? 'amber' : 'negative'"
              size="16px"
              rounded
              class="q-mr-sm"
            >
              <div class="absolute-full flex flex-center text-caption text-white text-weight-bold" style="font-size: 10px;">
                {{ cat.score }}%
              </div>
            </q-linear-progress>
          </div>
          <div class="col-auto" style="width: 50px;">
            <q-badge v-if="cat.score >= 80" color="positive" label="OK" dense />
            <q-badge v-else color="red-3" text-color="red-9" :label="`-${80 - cat.score}`" dense />
          </div>
        </div>
        <!-- 80% target line reference -->
        <div class="text-caption text-grey-5 text-right">Target: 80% (Distinction)</div>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { api, backendApi } from 'src/boot/axios'
import { Notify } from 'quasar'

interface EvalScores {
  overall_score: number
  knowledge_score: number
  critical_score: number
  application_score: number
  referencing_score: number
  structure_score: number
  ai_risk_score: number | null
}

interface Improvement {
  criterion: string
  current_score?: number
  location?: string
  before: string
  after: string
  why_better?: string
  marks_impact?: string
}

interface GuideData {
  target_score: number
  current_score: number
  gap: number
  improvements: Improvement[]
  overall_advice: string
}

const props = defineProps<{
  eval: EvalScores
  evaluationId: number
}>()

const score = computed(() => props.eval.overall_score)
const guideLoading = ref(false)
const guideLoaded = ref(false)
const guide = ref<GuideData | null>(null)

const headerIcon = computed(() => score.value >= 80 ? 'workspace_premium' : 'trending_up')
const headerColor = computed(() => score.value >= 80 ? 'positive' : 'amber-8')
const headerTitle = computed(() => score.value >= 80 ? 'Distinction Achieved!' : 'Your Path to Distinction (80%)')
const headerSubtitle = computed(() => {
  if (score.value >= 90) return `${score.value}% — Exceptional work.`
  if (score.value >= 80) return `${score.value}% — Well done! Maintain this quality.`
  if (score.value >= 70) return `${score.value}% — You're close! See below for specific rewrites.`
  if (score.value >= 60) return `${score.value}% — Solid foundation. These AI-powered rewrites show you exactly what to change.`
  return `${score.value}% — Let's build a plan. See specific rewrite examples below.`
})
const borderStyle = computed(() => score.value >= 80
  ? 'border: 2px solid #22c55e;'
  : 'border: 2px solid #f59e0b;'
)

const categories = computed(() => [
  { key: 'knowledge', label: 'Knowledge', score: props.eval.knowledge_score },
  { key: 'critical', label: 'Critical', score: props.eval.critical_score },
  { key: 'application', label: 'Application', score: props.eval.application_score },
  { key: 'referencing', label: 'Referencing', score: props.eval.referencing_score },
  { key: 'structure', label: 'Structure', score: props.eval.structure_score },
])

function criterionColor(criterion: string) {
  const map: Record<string, string> = {
    'Knowledge': 'blue',
    'Critical Thinking': 'purple',
    'Application': 'orange',
    'Referencing': 'teal',
    'Structure': 'indigo',
  }
  return map[criterion] || 'grey'
}

async function generateGuide() {
  guideLoading.value = true
  try {
    // 1. Get evaluation data from Express backend
    const { data: evalDetail } = await backendApi.get(`/evaluations/${props.evaluationId}`)
    const ev = evalDetail.evaluation
    const evalData = {
      overall_score: ev?.overall_score || 0,
      knowledge_score: ev?.knowledge_score || 0,
      critical_score: ev?.critical_score || 0,
      application_score: ev?.application_score || 0,
      referencing_score: ev?.referencing_score || 0,
      structure_score: ev?.structure_score || 0,
      subject: ev?.subject || '',
      issues: (evalDetail.issues || []).map((i: any) => ({
        category: i.category,
        severity: i.severity,
        description: i.description,
        recommendation: i.recommendation,
      })),
      strengths: (evalDetail.strengths || []).map((s: any) => ({
        category: s.category,
        what_well: s.what_well,
      })),
    }

    // 2. Call n8n for AI guide generation (no DB access)
    const { data } = await api.post('/bg-guide', evalData, { timeout: 120000 })

    if (data.error) throw new Error(data.error)
    guide.value = data as GuideData
    guideLoaded.value = true
  } catch (err) {
    console.error('Guide generation failed:', err)
    Notify.create({ type: 'negative', message: 'Failed to generate guide. Please try again.' })
  } finally {
    guideLoading.value = false
  }
}
</script>

<style scoped>
.before-after-block {
  margin-bottom: 8px;
}
.ba-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}
.ba-text {
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
}
</style>
