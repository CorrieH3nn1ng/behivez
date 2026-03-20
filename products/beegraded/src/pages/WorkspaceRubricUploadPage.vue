<template>
  <q-page class="honeycomb-bg">
    <div class="page-container" style="max-width: 640px;">
      <q-btn flat no-caps icon="arrow_back" label="Back to Evaluation" color="grey-7" to="/workspace/new" class="q-mb-md" />

      <h2 class="text-h5 text-weight-bold q-mb-xs">
        <q-icon name="upload_file" color="amber" class="q-mr-sm" />
        Upload Your Rubric
      </h2>
      <p class="text-grey-7 q-mb-lg" style="font-size: 14px;">
        Upload the rubric PDF from your lecturer. Our AI will extract the questions, marks allocation, and assessment criteria.
      </p>

      <!-- Upload state -->
      <template v-if="!parsedRubric">
        <q-card flat class="bee-card q-pa-lg">
          <q-file
            v-model="file"
            outlined
            label="Select rubric PDF"
            accept=".pdf"
            class="q-mb-md"
            :disable="uploading"
          >
            <template #prepend><q-icon name="picture_as_pdf" color="red" /></template>
          </q-file>

          <div v-if="uploading" class="q-mb-md">
            <q-linear-progress :value="uploadProgress / 100" color="amber" size="10px" rounded class="q-mb-xs" />
            <div class="text-caption text-grey-6 text-center">
              {{ uploadProgress < 100 ? 'Uploading...' : 'AI is extracting rubric details...' }}
            </div>
          </div>

          <q-btn
            class="btn-bee full-width"
            size="lg"
            no-caps
            label="Upload & Extract"
            :loading="uploading"
            :disable="!file"
            @click="handleUpload"
            icon="auto_awesome"
          />

          <div v-if="errorMsg" class="q-mt-md text-negative text-center text-caption">
            <q-icon name="error" size="16px" class="q-mr-xs" />
            {{ errorMsg }}
          </div>

          <div class="q-mt-lg text-caption text-grey-6">
            <div class="text-weight-bold q-mb-xs">Tips for best results:</div>
            <ul style="padding-left: 16px; margin: 0;">
              <li>Upload the official rubric PDF from your institution</li>
              <li>Ensure the PDF is text-based (not a scanned image)</li>
              <li>The PDF should contain questions/sections with marks allocation</li>
            </ul>
          </div>
        </q-card>
      </template>

      <!-- Confirmation state -->
      <template v-else>
        <RubricConfirmation
          :rubric="parsedRubric"
          :confirming="confirming"
          @confirm="handleConfirm"
          @reupload="handleReupload"
        />
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkspaceRubric } from 'src/composables/useWorkspaceRubric'
import { useEvalSessionStore } from 'src/stores/evaluation-session'
import type { ParsedRubric } from 'src/stores/token'
import RubricConfirmation from 'src/components/RubricConfirmation.vue'
import { Notify } from 'quasar'

const router = useRouter()
const evalSession = useEvalSessionStore()
const { uploading, uploadProgress, confirming, uploadRubricPdf, confirmRubric } = useWorkspaceRubric()

const file = ref<File | null>(null)
const parsedRubric = ref<ParsedRubric | null>(null)
const errorMsg = ref('')

async function handleUpload() {
  if (!file.value) return
  errorMsg.value = ''
  try {
    const result = await uploadRubricPdf(file.value)
    parsedRubric.value = result
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.error || 'Failed to process rubric. Please try again.'
  }
}

async function handleConfirm() {
  if (!parsedRubric.value) return
  try {
    const success = await confirmRubric(parsedRubric.value.id)
    if (success) {
      Notify.create({ type: 'positive', message: 'Rubric confirmed! Now upload your draft.' })
      router.push('/workspace/new')
    }
  } catch {
    Notify.create({ type: 'negative', message: 'Failed to confirm rubric. Please try again.' })
  }
}

function handleReupload() {
  parsedRubric.value = null
  file.value = null
}
</script>
