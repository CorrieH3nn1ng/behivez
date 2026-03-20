<template>
  <q-page class="honeycomb-bg">
    <div class="page-container" style="max-width: 640px;">
      <h2 class="text-h5 text-weight-bold q-mb-xs">
        <q-icon name="bolt" color="amber" class="q-mr-sm" />
        Quick Check — No Account Needed
      </h2>
      <p class="text-grey-7 q-mb-lg" style="font-size: 14px;">
        Upload, pay, get your report. No sign-up required. (No draft-to-final tracking.)
      </p>

      <q-card flat class="bee-card q-pa-lg">
        <q-file v-model="file" outlined label="Select .docx file" accept=".docx" class="q-mb-md">
          <template #prepend><q-icon name="attach_file" /></template>
        </q-file>

        <q-input v-model="subject" outlined label="Subject Name" class="q-mb-md">
          <template #prepend><q-icon name="book" /></template>
        </q-input>

        <q-input v-model="email" outlined type="email" label="Email (for report delivery)" class="q-mb-md">
          <template #prepend><q-icon name="email" /></template>
        </q-input>

        <q-select
          v-model="assessmentType"
          outlined
          label="Assessment Type"
          :options="['Summative Assessment', 'Formative Assessment', 'Essay', 'Research Paper', 'Case Study', 'Other']"
          class="q-mb-md"
        />

        <q-input v-model.number="numQuestions" outlined label="Number of Questions" type="number" min="1" max="20" class="q-mb-lg" />

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

        <q-btn
          class="btn-bee full-width" size="lg" no-caps
          :label="uploading ? `Uploading... ${uploadProgress}%` : 'Upload & Pay R20'"
          :loading="uploading"
          :disable="!file || !subject || !email"
          @click="handleQuickCheck"
        />
      </q-card>

      <div class="text-center q-mt-lg">
        <q-btn flat no-caps color="grey-7" label="Want draft-to-final tracking? Create an account" to="/get-started" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useEvaluation } from 'src/composables/useEvaluation'
import { Notify } from 'quasar'

const router = useRouter()
const { uploadPaper, uploading, uploadProgress } = useEvaluation()

const file = ref<File | null>(null)
const subject = ref('')
const email = ref('')
const assessmentType = ref('Summative Assessment')
const numQuestions = ref(4)
const mode = ref<'A' | 'B'>('A')

async function handleQuickCheck() {
  if (!file.value || !subject.value || !email.value) return
  try {
    const result = await uploadPaper(file.value, subject.value, assessmentType.value, numQuestions.value)
    router.push({ name: 'payment', params: { paperId: String(result.paper_id) }, query: { mode: mode.value, email: email.value, quick: '1' } })
  } catch {
    Notify.create({ type: 'negative', message: 'Upload failed. Please try again.' })
  }
}
</script>
