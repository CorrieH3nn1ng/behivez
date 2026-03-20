<template>
  <q-page class="honeycomb-bg">
    <div class="page-container">
      <div class="row items-center q-mb-lg">
        <q-btn flat no-caps icon="arrow_back" label="Back to Workspace" color="grey-7" to="/workspace" />
        <q-space />
        <q-btn outline no-caps icon="download" label="Download" color="amber-8" @click="downloadComparison" />
      </div>

      <h2 class="text-h5 text-weight-bold q-mb-xs">
        <q-icon name="compare_arrows" color="amber" class="q-mr-sm" />
        Draft vs Final Comparison
      </h2>
      <p class="text-grey-7 q-mb-lg" style="font-size: 14px;">See how your paper improved between draft and final submission.</p>

      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner-gears size="48px" color="amber" />
      </div>

      <template v-else>
        <!-- Score Overview -->
        <q-card flat class="bee-card q-pa-lg q-mb-lg">
          <div class="text-weight-bold q-mb-md" style="font-size: 16px;">Score Movement</div>
          <div class="row q-gutter-lg justify-center q-mb-lg">
            <div class="text-center">
              <div class="text-h3 text-weight-bold text-grey-6">{{ comparison.draftScore }}%</div>
              <div class="text-caption text-grey-5">Draft</div>
            </div>
            <div class="text-center flex flex-center">
              <q-icon name="arrow_forward" size="32px" color="amber" />
            </div>
            <div class="text-center">
              <div class="text-h3 text-weight-bold text-amber-8">{{ comparison.finalScore }}%</div>
              <div class="text-caption text-grey-5">Final</div>
            </div>
            <div class="text-center flex flex-center">
              <q-badge
                :color="comparison.improvement > 0 ? 'positive' : 'negative'"
                :label="`${comparison.improvement > 0 ? '+' : ''}${comparison.improvement}%`"
                style="font-size: 16px; padding: 8px 16px;"
              />
            </div>
          </div>

          <ComparisonChart :criteria="comparison.criteria" />
        </q-card>

        <!-- Issues Tracker -->
        <q-card flat class="bee-card q-pa-lg q-mb-lg">
          <div class="text-weight-bold q-mb-md" style="font-size: 16px;">Issues Tracker</div>
          <div class="row q-gutter-md">
            <div class="col">
              <div class="stat-chip bg-positive text-white q-pa-md rounded-borders text-center">
                <div class="text-h5 text-weight-bold">{{ comparison.issuesFixed }}</div>
                <div class="text-caption">Fixed</div>
              </div>
            </div>
            <div class="col">
              <div class="stat-chip bg-warning text-white q-pa-md rounded-borders text-center">
                <div class="text-h5 text-weight-bold">{{ comparison.issuesRemaining }}</div>
                <div class="text-caption">Remaining</div>
              </div>
            </div>
            <div class="col">
              <div class="stat-chip bg-info text-white q-pa-md rounded-borders text-center">
                <div class="text-h5 text-weight-bold">{{ comparison.newIssues }}</div>
                <div class="text-caption">New Issues</div>
              </div>
            </div>
          </div>
        </q-card>

        <!-- Monkey Detection Warning -->
        <q-banner v-if="comparison.monkeyFlag" class="bg-red-1 text-red q-mb-lg" rounded>
          <template #avatar><q-icon name="warning" color="negative" /></template>
          <strong>Copy Detection Warning:</strong> Some of your changes closely match the suggested examples from your draft report.
          Markers may flag this. Rewrite suggestions in your own words.
        </q-banner>

        <!-- Full comparison HTML -->
        <div v-if="comparison.comparisonHtml" class="bee-card" v-html="comparison.comparisonHtml" />
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ComparisonChart from 'src/components/ComparisonChart.vue'
import { backendApi } from 'src/boot/axios'

const props = defineProps<{ draftId: string; finalId: string }>()
const loading = ref(true)

const comparison = ref({
  draftScore: 0,
  finalScore: 0,
  improvement: 0,
  issuesFixed: 0,
  issuesRemaining: 0,
  newIssues: 0,
  monkeyFlag: false,
  comparisonHtml: '',
  criteria: [] as Array<{ key: string; label: string; draft: number; final: number }>,
})

onMounted(async () => {
  try {
    const { data } = await backendApi.get<typeof comparison.value>(`/comparisons/${props.draftId}/${props.finalId}`)
    comparison.value = data
  } catch { /* handle error */ } finally {
    loading.value = false
  }
})

function downloadComparison() {
  const html = comparison.value.comparisonHtml || '<p>No comparison data</p>'
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `BeeGraded-Comparison-${props.draftId}-vs-${props.finalId}.html`
  a.click()
  URL.revokeObjectURL(url)
}
</script>
