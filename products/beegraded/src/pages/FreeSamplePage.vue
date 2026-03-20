<template>
  <q-page class="honeycomb-bg">
    <div class="page-container" style="max-width: 640px;">
      <h2 class="text-h5 text-weight-bold q-mb-xs">
        <q-icon name="hive" color="amber" class="q-mr-sm" />
        Free Sample Evaluation
      </h2>
      <p class="text-grey-7 q-mb-lg" style="font-size: 14px;">
        Upload your paper and get a teaser report — free, no sign-up. One per email address.
      </p>

      <q-card flat class="bee-card q-pa-lg">
        <!-- Email -->
        <q-input v-model="email" outlined type="email" label="Email address" class="q-mb-md" :disable="submitting">
          <template #prepend><q-icon name="email" /></template>
        </q-input>

        <!-- File upload -->
        <q-file v-model="file" outlined label="Select .docx file" accept=".docx" class="q-mb-md" :disable="submitting">
          <template #prepend><q-icon name="attach_file" /></template>
        </q-file>

        <!-- Subject -->
        <q-input v-model="subject" outlined label="Subject Name" class="q-mb-md" :disable="submitting">
          <template #prepend><q-icon name="book" /></template>
        </q-input>

        <!-- Assessment type -->
        <q-select
          v-model="assessmentType"
          outlined
          label="Assessment Type"
          :options="assessmentOptions"
          class="q-mb-lg"
          :disable="submitting"
        />

        <!-- Submit -->
        <q-btn
          class="btn-bee full-width"
          size="lg"
          no-caps
          :label="submitting ? `Processing... ${uploadProgress}%` : 'Get Free Sample'"
          :loading="submitting"
          :disable="!canSubmit"
          @click="handleSubmit"
          icon="hive"
        />

        <!-- Error -->
        <div v-if="errorMsg" class="q-mt-md text-negative text-center text-caption">
          <q-icon name="error" size="16px" class="q-mr-xs" />
          {{ errorMsg }}
        </div>
      </q-card>

      <div class="text-center q-mt-lg">
        <div class="text-caption text-grey-6 q-mb-sm">Want the full experience with your own rubric?</div>
        <q-btn flat no-caps color="amber-8" label="Buy Token — R25" to="/buy-token" size="sm" icon="token" />
        <span class="text-grey-5 q-mx-sm">or</span>
        <q-btn flat no-caps color="grey-7" label="Create Account — R20/eval" to="/get-started" size="sm" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from 'src/composables/useApi'
import { Notify } from 'quasar'

const router = useRouter()
const { upload } = useApi()

const email = ref('')
const file = ref<File | null>(null)
const subject = ref('')
const assessmentType = ref('Summative Assessment')
const submitting = ref(false)
const uploadProgress = ref(0)
const errorMsg = ref('')

const assessmentOptions = [
  'Summative Assessment', 'Formative Assessment', 'Essay',
  'Research Paper', 'Case Study', 'Other',
]

const canSubmit = computed(() => !!email.value.trim() && !!file.value && !!subject.value.trim() && !submitting.value)

async function handleSubmit() {
  if (!canSubmit.value || !file.value) return
  errorMsg.value = ''
  submitting.value = true
  uploadProgress.value = 0

  const formData = new FormData()
  formData.append('file', file.value)
  formData.append('email', email.value.trim().toLowerCase())
  formData.append('subject', subject.value.trim())
  formData.append('assessment_type', assessmentType.value)

  try {
    const data = await upload<{ sample_id: number; error?: string }>('/bg-free-sample', formData, (pct) => {
      uploadProgress.value = pct
    })

    if (data.error) {
      errorMsg.value = data.error
      return
    }

    // Navigate to processing page
    router.push({
      name: 'free-sample-processing',
      params: { sampleId: String(data.sample_id) },
    })
  } catch (err: any) {
    const msg = err?.response?.data?.error || err?.response?.data?.message
    if (msg) {
      errorMsg.value = msg
    } else {
      errorMsg.value = 'Something went wrong. Please try again.'
      Notify.create({ type: 'negative', message: 'Upload failed.' })
    }
  } finally {
    submitting.value = false
  }
}
</script>
