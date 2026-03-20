<template>
  <q-page class="honeycomb-bg">
    <div class="page-container">
      <div class="row items-center q-mb-lg">
        <div>
          <h2 class="text-h5 text-weight-bold q-mb-none">
            <q-icon name="dashboard" color="amber" class="q-mr-sm" />
            My Papers
          </h2>
          <p class="text-grey-7 q-mb-none" style="font-size: 14px;">Your evaluation history and reports.</p>
        </div>
        <q-space />
        <q-btn class="btn-bee" no-caps label="Check New Paper" to="/upload" icon="add" />
      </div>

      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner-gears size="48px" color="amber" />
      </div>

      <div v-else-if="papers.length === 0" class="text-center q-pa-xl">
        <q-icon name="description" size="64px" color="grey-4" />
        <p class="text-grey-5 q-mt-md text-h6">No papers yet</p>
        <p class="text-grey-6">Upload your first paper to get started.</p>
        <q-btn class="btn-bee q-mt-md" no-caps label="Upload Paper" to="/upload" />
      </div>

      <div v-else>
        <q-card v-for="paper in papers" :key="paper.id" flat class="bee-card q-pa-lg q-mb-md">
          <div class="row items-center">
            <q-icon name="description" size="36px" color="amber" class="q-mr-md" />
            <div class="col">
              <div class="text-weight-bold" style="font-size: 15px;">{{ paper.filename }}</div>
              <div class="text-caption text-grey-7">
                {{ paper.subject }} &bull; {{ paper.assessment_type }} &bull; {{ paper.word_count?.toLocaleString() }} words
              </div>
              <div class="text-caption text-grey-5">Uploaded {{ formatDate(paper.uploaded_at) }}</div>
            </div>
            <q-space />
            <div class="row q-gutter-sm">
              <q-btn
                v-for="eval_ in paper.evaluations"
                :key="eval_.id"
                outline
                no-caps
                size="sm"
                :color="eval_.mode === 'A' ? 'blue' : 'red'"
                :label="`${eval_.draft_or_final === 'draft' ? 'Draft' : 'Final'} — Mode ${eval_.mode} (${eval_.overall_score}%)`"
                :to="`/report/${eval_.id}`"
              />
              <q-btn
                v-if="hasDraftAndFinal(paper)"
                outline
                no-caps
                size="sm"
                color="amber"
                icon="compare_arrows"
                label="Compare"
                :to="comparisonRoute(paper)"
              />
            </div>
          </div>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useEvaluation } from 'src/composables/useEvaluation'

interface Evaluation {
  id: number
  mode: 'A' | 'B'
  draft_or_final: 'draft' | 'final'
  overall_score: number
}

interface Paper {
  id: number
  filename: string
  subject: string
  assessment_type: string
  word_count: number
  uploaded_at: string
  evaluations: Evaluation[]
}

const { getUserPapers } = useEvaluation()
const loading = ref(true)
const papers = ref<Paper[]>([])

onMounted(async () => {
  try {
    const data = await getUserPapers()
    papers.value = data as Paper[]
  } catch { /* empty */ } finally {
    loading.value = false
  }
})

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
}

function hasDraftAndFinal(paper: Paper) {
  return paper.evaluations.some(e => e.draft_or_final === 'draft') && paper.evaluations.some(e => e.draft_or_final === 'final')
}

function comparisonRoute(paper: Paper) {
  const draft = paper.evaluations.find(e => e.draft_or_final === 'draft')
  const final_ = paper.evaluations.find(e => e.draft_or_final === 'final')
  if (draft && final_) return `/comparison/${draft.id}/${final_.id}`
  return '/dashboard'
}
</script>
