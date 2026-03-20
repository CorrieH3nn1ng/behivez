<template>
  <q-card flat class="bee-card q-pa-lg q-mb-md">
    <div class="row items-center">
      <q-icon name="description" size="36px" color="amber" class="q-mr-md" />
      <div class="col">
        <div class="text-weight-bold" style="font-size: 15px;">{{ paper.filename }}</div>
        <div class="text-caption text-grey-7">
          {{ paper.subject }} &bull; {{ paper.assessment_type }} &bull; {{ paper.word_count?.toLocaleString() }} words
        </div>
        <div class="text-caption text-grey-5">
          Uploaded {{ formatDate(paper.uploaded_at) }}
          <q-badge v-if="paper.draft_or_final === 'final'" color="positive" class="q-ml-sm">Final</q-badge>
          <q-badge v-else color="blue" class="q-ml-sm">Draft</q-badge>
        </div>
      </div>
      <q-space />
      <div class="row q-gutter-sm items-center">
        <!-- Evaluation buttons -->
        <q-btn
          v-for="eval_ in paper.evaluations"
          :key="eval_.id"
          outline
          no-caps
          size="sm"
          :color="eval_.mode === 'A' ? 'blue' : 'red'"
          :label="`${eval_.draft_or_final === 'draft' ? 'Draft' : 'Final'} — Mode ${eval_.mode} (${eval_.overall_score}%)`"
          :to="`/workspace/report/${eval_.id}`"
        />

        <!-- Upload Final action -->
        <q-btn
          v-if="showUploadFinal"
          outline
          no-caps
          size="sm"
          color="green"
          icon="upload_file"
          label="Upload Final"
          :to="`/workspace/upload/${paper.id}/final`"
        />

        <!-- Compare action -->
        <q-btn
          v-if="hasDraftAndFinal"
          outline
          no-caps
          size="sm"
          color="amber"
          icon="compare_arrows"
          label="Compare"
          :to="comparisonRoute"
        />

        <!-- Delete -->
        <q-btn
          flat
          round
          dense
          icon="delete_forever"
          color="grey-5"
          size="sm"
          @click="confirmDelete"
          :loading="deleting"
        >
          <q-tooltip>Permanently delete</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- POPIA delete confirmation dialog -->
    <q-dialog v-model="showDeleteDialog" persistent>
      <q-card style="min-width: 350px;">
        <q-card-section class="row items-center">
          <q-icon name="warning" color="negative" size="28px" class="q-mr-sm" />
          <span class="text-weight-bold">Permanently Delete?</span>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <p>This will <strong>permanently delete</strong> this paper, all evaluations, scores, issues, strengths, and reference audits associated with it.</p>
          <p class="text-negative text-weight-bold">This action cannot be undone (POPIA compliant — no data is retained).</p>
          <p class="text-caption text-grey-7">Paper: {{ paper.filename }}</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps label="Cancel" color="grey-7" v-close-popup />
          <q-btn flat no-caps label="Yes, permanently delete" color="negative" @click="handleDelete" :loading="deleting" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { backendApi } from 'src/boot/axios'
import { Notify } from 'quasar'

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
  draft_or_final?: string
  linked_paper_id?: number
  evaluations: Evaluation[]
}

const props = defineProps<{ paper: Paper }>()
const emit = defineEmits<{ deleted: [paperId: number] }>()

const showDeleteDialog = ref(false)
const deleting = ref(false)

function confirmDelete() {
  showDeleteDialog.value = true
}

async function handleDelete() {
  deleting.value = true
  try {
    await backendApi.delete(`/papers/${props.paper.id}`)
    showDeleteDialog.value = false
    Notify.create({ type: 'positive', message: 'Paper and all related data permanently deleted.' })
    emit('deleted', props.paper.id)
  } catch {
    Notify.create({ type: 'negative', message: 'Failed to delete. Please try again.' })
  } finally {
    deleting.value = false
  }
}

const hasDraftAndFinal = computed(() =>
  props.paper.evaluations.some(e => e.draft_or_final === 'draft') &&
  props.paper.evaluations.some(e => e.draft_or_final === 'final')
)

const showUploadFinal = computed(() =>
  props.paper.evaluations.length > 0 &&
  !props.paper.evaluations.some(e => e.draft_or_final === 'final') &&
  (props.paper.draft_or_final !== 'final')
)

const comparisonRoute = computed(() => {
  const draft = props.paper.evaluations.find(e => e.draft_or_final === 'draft')
  const final_ = props.paper.evaluations.find(e => e.draft_or_final === 'final')
  if (draft && final_) return `/workspace/comparison/${draft.id}/${final_.id}`
  return '/workspace'
})

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>
