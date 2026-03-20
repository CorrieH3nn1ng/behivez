<template>
  <q-page class="flex flex-center" style="min-height: 80vh;">
    <q-card flat bordered class="q-pa-xl" style="max-width: 420px; width: 100%;">
      <div class="text-center q-mb-lg">
        <q-icon name="lock_reset" size="48px" color="brown-8" class="q-mb-sm" />
        <h5 class="text-h5 text-weight-bold q-mb-xs q-mt-none">Reset Password</h5>
        <p class="text-grey-7" style="font-size: 14px;">Enter your new password below.</p>
      </div>

      <template v-if="!done">
        <q-input
          v-model="newPassword"
          outlined dense
          :type="showPassword ? 'text' : 'password'"
          label="New password"
          class="q-mb-md"
          :disable="loading"
          @keyup.enter="handleReset"
        >
          <template #prepend><q-icon name="lock" /></template>
          <template #append>
            <q-icon :name="showPassword ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="showPassword = !showPassword" />
          </template>
        </q-input>

        <q-input
          v-model="confirmPassword"
          outlined dense
          :type="showPassword ? 'text' : 'password'"
          label="Confirm new password"
          class="q-mb-md"
          :disable="loading"
          @keyup.enter="handleReset"
        >
          <template #prepend><q-icon name="lock" /></template>
        </q-input>

        <div v-if="errorMsg" class="q-mb-md text-negative text-caption text-center">
          <q-icon name="error" size="16px" class="q-mr-xs" />{{ errorMsg }}
        </div>

        <q-btn
          color="brown-8"
          class="full-width"
          size="lg"
          no-caps
          label="Reset Password"
          :loading="loading"
          :disable="!canSubmit"
          @click="handleReset"
        />
      </template>

      <template v-else>
        <div class="text-center">
          <q-icon name="check_circle" size="48px" color="positive" class="q-mb-md" />
          <p class="text-subtitle1 text-weight-bold">Password updated!</p>
          <p class="text-grey-7" style="font-size: 13px;">You can now log in with your new password.</p>
          <q-btn color="brown-8" no-caps label="Go to Login" to="/login" class="q-mt-md" />
        </div>
      </template>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const token = route.query.token as string

const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const loading = ref(false)
const done = ref(false)
const errorMsg = ref('')

const canSubmit = computed(() => {
  return newPassword.value.length >= 8 && newPassword.value === confirmPassword.value && !loading.value
})

async function handleReset() {
  if (!canSubmit.value) return
  if (!token) {
    errorMsg.value = 'Invalid or missing reset token. Please request a new link.'
    return
  }

  loading.value = true
  errorMsg.value = ''

  try {
    await axios.post('/auth/reset-password', { token, newPassword: newPassword.value })
    done.value = true
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.error || 'Reset link is invalid or expired. Please request a new one.'
  } finally {
    loading.value = false
  }
}
</script>
