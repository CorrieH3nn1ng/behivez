<template>
  <q-page class="honeycomb-bg">
    <div class="page-container">
      <!-- Header -->
      <div class="row items-center q-mb-lg">
        <div>
          <h2 class="text-h5 text-weight-bold q-mb-none">
            <q-icon name="hive" color="amber" class="q-mr-sm" />
            My Workspace
          </h2>
          <p class="text-grey-7 q-mb-none" style="font-size: 14px;">Your papers, reports, and evaluation history.</p>
        </div>
        <q-space />
        <q-badge v-if="couponStore.isValid" color="green" class="q-mr-md q-pa-sm" style="font-size: 12px;">
          <q-icon name="redeem" size="14px" class="q-mr-xs" />
          {{ couponStore.discount_percent === 100 ? 'Free' : `${couponStore.discount_percent}% off` }}
          via {{ couponStore.affiliate_name }}
        </q-badge>
        <q-btn class="btn-bee" no-caps label="New Evaluation" icon="add" @click="handleNewEvaluation" />
      </div>

      <!-- Imported history notice -->
      <q-banner v-if="showImportNotice" class="bg-amber-1 q-mb-md rounded-borders" dense>
        <template #avatar>
          <q-icon name="info" color="amber" />
        </template>
        We imported {{ importedCount }} previous evaluation(s) from your token purchases.
        <template #action>
          <q-btn flat no-caps label="Dismiss" color="amber-8" @click="showImportNotice = false" />
        </template>
      </q-banner>

      <!-- Current evaluation session -->
      <q-card v-if="hasSession" flat class="bee-card q-pa-lg q-mb-lg">
        <div class="row items-center q-mb-md">
          <q-icon name="hive" color="amber" size="24px" class="q-mr-sm" />
          <span class="text-weight-bold">Current Evaluation Session</span>
          <q-space />
          <q-btn flat no-caps label="Continue" color="amber" icon="arrow_forward" @click="continueSession" />
          <q-btn flat round dense icon="delete_forever" color="grey-5" size="sm" @click="confirmDeleteSession" :loading="deletingSession">
            <q-tooltip>Permanently delete session data (POPIA)</q-tooltip>
          </q-btn>
        </div>
        <div class="row q-gutter-md">
          <q-card v-if="evalSession.session?.rubric" flat bordered class="col q-pa-sm" style="border-radius:8px">
            <div class="text-caption text-grey-6">Rubric</div>
            <div class="text-weight-bold">{{ evalSession.session.rubric.module_name || 'Custom' }}</div>
          </q-card>
          <q-card v-if="evalSession.session?.draft_evaluation_id" flat bordered class="col q-pa-sm cursor-pointer" style="border-radius:8px" @click="router.push(`/workspace/report/${evalSession.session.draft_evaluation_id}`)">
            <div class="text-caption text-grey-6">Draft Report</div>
            <div class="text-weight-bold text-positive">
              <q-icon name="check_circle" size="14px" class="q-mr-xs" />Ready — Click to view
            </div>
          </q-card>
          <q-card v-if="evalSession.session?.final_evaluation_id" flat bordered class="col q-pa-sm cursor-pointer" style="border-radius:8px" @click="router.push(`/workspace/report/${evalSession.session.final_evaluation_id}`)">
            <div class="text-caption text-grey-6">Final Report</div>
            <div class="text-weight-bold text-positive">
              <q-icon name="check_circle" size="14px" class="q-mr-xs" />Ready — Click to view
            </div>
          </q-card>
        </div>
      </q-card>

      <!-- POPIA session delete confirmation -->
      <q-dialog v-model="showSessionDeleteDialog" persistent>
        <q-card style="min-width: 350px;">
          <q-card-section class="row items-center">
            <q-icon name="warning" color="negative" size="28px" class="q-mr-sm" />
            <span class="text-weight-bold">Permanently Delete Session Data?</span>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <p>This will <strong>permanently delete</strong> all papers, evaluations, scores, and rubric data from this session.</p>
            <p class="text-negative text-weight-bold">This action cannot be undone (POPIA compliant — no data is retained).</p>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat no-caps label="Cancel" color="grey-7" v-close-popup />
            <q-btn flat no-caps label="Yes, permanently delete" color="negative" @click="handleDeleteSession" :loading="deletingSession" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Loading -->
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner-gears size="48px" color="amber" />
      </div>

      <!-- Empty state -->
      <div v-else-if="papers.length === 0 && !hasSession" class="text-center q-pa-xl">
        <q-icon name="description" size="64px" color="grey-4" />
        <p class="text-grey-5 q-mt-md text-h6">No papers yet</p>
        <p class="text-grey-6">Upload your first paper to get started.</p>
        <q-btn class="btn-bee q-mt-md" no-caps label="Start Your First Evaluation" icon="upload_file" @click="handleNewEvaluation" />
      </div>

      <!-- Paper list -->
      <div v-else-if="papers.length > 0">
        <PaperCard v-for="paper in papers" :key="paper.id" :paper="paper" @deleted="onPaperDeleted" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { backendApi } from 'src/boot/axios'
import { useAuthStore } from 'src/stores/auth'
import { useCouponStore } from 'src/stores/coupon'
import { useEvalSessionStore } from 'src/stores/evaluation-session'
import { Notify } from 'quasar'
import PaperCard from 'src/components/PaperCard.vue'

const router = useRouter()
const authStore = useAuthStore()
const couponStore = useCouponStore()
const evalSession = useEvalSessionStore()
const loading = ref(true)
const papers = ref<any[]>([])
const showImportNotice = ref(false)
const importedCount = ref(0)

// Show current eval session if it has any data (rubric, paper, or results)
const hasSession = computed(() => {
  const s = evalSession.session
  return s && (s.rubric_id || s.draft_paper_id || s.draft_evaluation_id || s.final_evaluation_id)
})

function handleNewEvaluation() {
  evalSession.startNew()
  router.push('/workspace/new')
}

function continueSession() {
  router.push('/workspace/new')
}

const showSessionDeleteDialog = ref(false)
const deletingSession = ref(false)

function confirmDeleteSession() {
  showSessionDeleteDialog.value = true
}

async function handleDeleteSession() {
  deletingSession.value = true
  try {
    const s = evalSession.session
    if (!s) return

    // Delete draft paper (cascades evaluations, issues, strengths, refs, consistency)
    if (s.draft_paper_id) {
      await backendApi.delete(`/papers/${s.draft_paper_id}`).catch(() => {})
      papers.value = papers.value.filter(p => p.id !== s.draft_paper_id)
    }
    // Delete final paper
    if (s.final_paper_id) {
      await backendApi.delete(`/papers/${s.final_paper_id}`).catch(() => {})
      papers.value = papers.value.filter(p => p.id !== s.final_paper_id)
    }

    evalSession.clear()
    showSessionDeleteDialog.value = false
    Notify.create({ type: 'positive', message: 'Session data permanently deleted.' })
  } catch {
    Notify.create({ type: 'negative', message: 'Failed to delete. Please try again.' })
  } finally {
    deletingSession.value = false
  }
}

function onPaperDeleted(paperId: number) {
  papers.value = papers.value.filter(p => p.id !== paperId)
}

onMounted(async () => {
  try {
    const { data } = await backendApi.get('/papers')
    papers.value = data as any[]
  } catch { /* empty */ } finally {
    loading.value = false
  }
})
</script>
