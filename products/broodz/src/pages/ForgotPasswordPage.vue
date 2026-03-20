<template>
  <q-page class="flex flex-center" style="min-height: 80vh;">
    <q-card flat bordered class="q-pa-xl" style="max-width: 420px; width: 100%;">
      <div class="text-center q-mb-lg">
        <q-icon name="lock_reset" size="48px" color="brown-8" class="q-mb-sm" />
        <h5 class="text-h5 text-weight-bold q-mb-xs q-mt-none">Forgot Password</h5>
        <p class="text-grey-7" style="font-size: 14px;">
          Enter your email and we'll send you a link to reset your password.
        </p>
      </div>

      <template v-if="!sent">
        <q-input
          v-model="email"
          outlined dense
          type="email"
          label="Email address"
          class="q-mb-md"
          :disable="loading"
          @keyup.enter="handleSubmit"
        >
          <template #prepend><q-icon name="mail" /></template>
        </q-input>

        <div v-if="errorMsg" class="q-mb-md text-negative text-caption text-center">
          <q-icon name="error" size="16px" class="q-mr-xs" />{{ errorMsg }}
        </div>

        <q-btn
          color="brown-8"
          class="full-width"
          size="lg"
          no-caps
          label="Send Reset Link"
          :loading="loading"
          :disable="!email.trim()"
          @click="handleSubmit"
        />
      </template>

      <template v-else>
        <div class="text-center">
          <q-icon name="mark_email_read" size="48px" color="positive" class="q-mb-md" />
          <p class="text-subtitle1 text-weight-bold">Check your email</p>
          <p class="text-grey-7" style="font-size: 13px;">
            If an account exists for <strong>{{ email }}</strong>, we've sent a password reset link.
          </p>
        </div>
      </template>

      <div class="text-center q-mt-lg">
        <q-btn flat no-caps label="Back to login" color="brown-8" size="sm" to="/login" />
      </div>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'

const email = ref('')
const loading = ref(false)
const sent = ref(false)
const errorMsg = ref('')

async function handleSubmit() {
  if (!email.value.trim()) return
  loading.value = true
  errorMsg.value = ''

  try {
    await axios.post('/auth/forgot-password', { email: email.value.trim() })
    sent.value = true
  } catch (err: any) {
    // Always show success to prevent email enumeration
    sent.value = true
  } finally {
    loading.value = false
  }
}
</script>
