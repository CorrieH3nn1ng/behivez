<template>
  <q-page class="honeycomb-bg">
    <div class="page-container" style="max-width: 640px;">
      <q-btn flat no-caps icon="arrow_back" label="Back to Token Hub" color="grey-7" :to="`/t/${tokenCode}`" class="q-mb-md" />

      <h2 class="text-h5 text-weight-bold q-mb-xs">
        <q-icon :name="isFinal ? 'upgrade' : 'description'" color="amber" class="q-mr-sm" />
        Upload {{ isFinal ? 'Final' : 'Draft' }} Paper
      </h2>
      <p class="text-grey-7 q-mb-lg" style="font-size: 14px;">
        <template v-if="isFinal">
          Upload your revised paper. We'll evaluate it against your rubric and compare with your draft.
        </template>
        <template v-else>
          Upload your .docx draft paper. It will be evaluated against your uploaded rubric.
        </template>
      </p>

      <!-- Rubric summary -->
      <div v-if="tokenStore.rubric" class="q-pa-sm bg-amber-1 rounded-borders q-mb-md">
        <q-icon name="fact_check" color="amber" size="16px" class="q-mr-xs" />
        <span class="text-caption text-weight-bold">Rubric:</span>
        <span class="text-caption">
          {{ tokenStore.rubric.module_name || 'Custom' }} &middot;
          {{ tokenStore.rubric.questions?.length || 0 }} questions &middot;
          {{ tokenStore.rubric.total_marks }} marks
        </span>
      </div>

      <q-card flat class="bee-card q-pa-lg">
        <!-- File -->
        <q-file v-model="file" outlined label="Select .docx or .pdf file" accept=".docx,.pdf,.doc" class="q-mb-md" :disable="uploading">
          <template #prepend><q-icon name="attach_file" /></template>
        </q-file>

        <!-- Subject -->
        <q-input v-model="subject" outlined label="Subject Name" class="q-mb-md" :disable="uploading">
          <template #prepend><q-icon name="book" /></template>
        </q-input>

        <!-- Mode Selection -->
        <div class="text-weight-bold q-mb-sm">Evaluation Mode</div>
        <div class="row q-gutter-md q-mb-lg">
          <q-card
            flat class="col cursor-pointer q-pa-md"
            :style="mode === 'A' ? 'border: 2px solid #3b82f6; background: #eff6ff;' : 'border: 2px solid transparent; background: #f5f5f5;'"
            style="border-radius: 12px;" @click="mode = 'A'"
          >
            <q-icon name="school" :color="mode === 'A' ? 'blue' : 'grey'" size="24px" />
            <div class="text-weight-bold q-mt-xs">Mode A — Academic Quality</div>
          </q-card>
          <q-card
            flat class="col cursor-pointer q-pa-md"
            :style="mode === 'B' ? 'border: 2px solid #ef4444; background: #fef2f2;' : 'border: 2px solid transparent; background: #f5f5f5;'"
            style="border-radius: 12px;" @click="mode = 'B'"
          >
            <q-icon name="shield" :color="mode === 'B' ? 'red' : 'grey'" size="24px" />
            <div class="text-weight-bold q-mt-xs">Mode B — Turnitin Ready</div>
          </q-card>
        </div>

        <!-- Upload progress -->
        <div v-if="uploading" class="q-mb-md">
          <q-linear-progress :value="uploadProgress / 100" color="amber" size="10px" rounded class="q-mb-xs" />
          <div class="text-caption text-grey-6 text-center">Uploading... {{ uploadProgress }}%</div>
        </div>

        <!-- Submit -->
        <q-btn
          class="btn-bee full-width"
          size="lg"
          no-caps
          :label="uploading ? 'Uploading...' : `Upload ${isFinal ? 'Final' : 'Draft'}`"
          :loading="uploading"
          :disable="!file || !subject.trim()"
          @click="handleUpload"
          icon="upload_file"
        />

        <div v-if="errorMsg" class="q-mt-md text-negative text-center text-caption">
          <q-icon name="error" size="16px" class="q-mr-xs" />
          {{ errorMsg }}
        </div>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { backendApi } from 'src/boot/axios'
import { useTokenStore } from 'src/stores/token'
import { Notify } from 'quasar'
import type { AxiosProgressEvent } from 'axios'

const props = defineProps<{
  tokenCode: string
  isFinal?: boolean
}>()

const router = useRouter()
const tokenStore = useTokenStore()

const file = ref<File | null>(null)
const subject = ref('')
const mode = ref<'A' | 'B'>('A')
const uploading = ref(false)
const uploadProgress = ref(0)
const errorMsg = ref('')

async function handleUpload() {
  if (!file.value || !subject.value.trim()) return
  errorMsg.value = ''
  uploading.value = true
  uploadProgress.value = 0

  const formData = new FormData()
  formData.append('file', file.value)
  formData.append('subject', subject.value.trim())
  formData.append('token_code', props.tokenCode)
  formData.append('mode', mode.value)
  formData.append('draft_or_final', props.isFinal ? 'final' : 'draft')

  if (props.isFinal && tokenStore.tokenData?.draft_paper_id) {
    formData.append('linked_paper_id', String(tokenStore.tokenData.draft_paper_id))
  }

  try {
    const { data } = await backendApi.post<{ paper_id: number }>('/papers', formData, {
      onUploadProgress: (e: AxiosProgressEvent) => {
        if (e.total) uploadProgress.value = Math.round((e.loaded * 100) / e.total)
      },
    })

    // Update token store
    if (props.isFinal) {
      tokenStore.updateTokenData({ final_paper_id: data.paper_id })
    } else {
      tokenStore.updateTokenData({ draft_paper_id: data.paper_id })
    }

    // Navigate to processing
    router.push({
      name: 'token-processing',
      params: { tokenCode: props.tokenCode, paperId: String(data.paper_id) },
      query: { mode: mode.value },
    })
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.error || 'Upload failed. Please try again.'
    Notify.create({ type: 'negative', message: errorMsg.value })
  } finally {
    uploading.value = false
  }
}
</script>
