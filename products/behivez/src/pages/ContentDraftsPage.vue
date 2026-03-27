<template>
  <q-page class="q-pa-xl" style="max-width: 1000px; margin: 0 auto;">
    <div class="row items-center q-mb-lg">
      <div class="text-h4 text-weight-bold text-grey-9 col">Saved Content</div>
      <q-btn label="Create New" color="amber-8" text-color="white" no-caps unelevated icon="add" to="/my/content-creator" />
    </div>

    <q-spinner-dots v-if="store.loading" size="48px" color="amber-8" class="q-mx-auto block q-my-xl" />

    <q-banner v-if="error" class="bg-red-1 text-red-8 q-mb-lg" rounded>{{ error }}</q-banner>

    <div v-if="!store.loading && store.drafts.length === 0" class="text-center q-my-xl text-grey-6">
      <q-icon name="inbox" size="64px" color="grey-4" />
      <div class="q-mt-md">No saved content yet.</div>
      <q-btn label="Create Your First" color="amber-8" text-color="white" no-caps unelevated class="q-mt-md" to="/my/content-creator" />
    </div>

    <div class="row q-gutter-md">
      <div v-for="draft in store.drafts" :key="draft.id" class="col-12 col-sm-6 col-md-4">
        <q-card flat bordered class="draft-card">
          <!-- Thumbnail -->
          <div class="draft-thumb flex flex-center">
            <img
              v-if="draft.imageData && draft.imageData.startsWith('data:')"
              :src="draft.imageData"
              style="width: 100%; height: 100%; object-fit: cover;"
            />
            <q-icon v-else name="image" size="48px" color="grey-4" />
          </div>

          <q-card-section>
            <div class="text-subtitle2 text-weight-bold text-grey-9 ellipsis">{{ draft.topic }}</div>
            <div v-if="draft.message" class="text-caption text-grey-7 ellipsis-2-lines q-mt-xs">{{ draft.message }}</div>
            <div class="text-caption text-grey-5 q-mt-xs">{{ formatDate(draft.createdAt) }}</div>
          </q-card-section>

          <q-card-actions>
            <q-btn flat dense no-caps icon="download" label="Download" color="amber-9" @click="downloadDraft(draft)" />
            <q-space />
            <q-btn flat dense no-caps icon="delete" color="red-7" @click="removeDraft(draft)" />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Notify } from 'quasar'
import { useContentStore, type ContentDraft } from 'stores/content'

const store = useContentStore()
const error = ref('')

onMounted(async () => {
  try {
    await store.loadDrafts()
  } catch {
    error.value = 'Failed to load drafts.'
  }
})

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })
}

function downloadDraft(draft: ContentDraft) {
  if (!draft.imageData) {
    Notify.create({ type: 'warning', message: 'No image to download.' })
    return
  }
  const link = document.createElement('a')
  link.href = draft.imageData.startsWith('data:') ? draft.imageData : 'data:image/svg+xml;base64,' + btoa(draft.imageData)
  link.download = `behivez-${draft.topic.replace(/\s+/g, '-').toLowerCase()}.png`
  link.click()
}

async function removeDraft(draft: ContentDraft) {
  if (!draft.id) return
  try {
    await store.deleteDraft(draft.id)
    Notify.create({ type: 'positive', message: 'Draft deleted.' })
  } catch {
    Notify.create({ type: 'negative', message: 'Failed to delete.' })
  }
}
</script>

<style lang="scss" scoped>
.draft-card {
  background: #fffbeb;
  border-color: rgba(245, 158, 11, 0.2) !important;
  transition: transform 0.2s;
  &:hover { transform: translateY(-2px); }
}

.draft-thumb {
  width: 100%;
  aspect-ratio: 1;
  background: #f5f0e8;
  overflow: hidden;
}
</style>
