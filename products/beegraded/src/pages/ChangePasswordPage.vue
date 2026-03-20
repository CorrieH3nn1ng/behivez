<template>
  <q-page class="honeycomb-bg flex flex-center" style="min-height: 80vh;">
    <q-card flat class="bee-card q-pa-xl" style="max-width: 420px; width: 100%;">
      <div class="text-center q-mb-lg">
        <q-icon name="lock_reset" size="48px" color="amber" class="q-mb-sm" />
        <h2 class="text-h5 text-weight-bold q-mb-xs">Change Your Password</h2>
        <p class="text-grey-7" style="font-size: 14px;">Your account requires a password update before you can continue.</p>
      </div>

      <q-input
        v-model="currentPassword"
        outlined dense
        :type="showCurrent ? 'text' : 'password'"
        label="Current Password"
        class="q-mb-md"
        :disable="loading"
        @keyup.enter="handleChange"
      >
        <template #prepend><q-icon name="lock" /></template>
        <template #append>
          <q-icon :name="showCurrent ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="showCurrent = !showCurrent" />
        </template>
      </q-input>

      <q-input
        v-model="newPassword"
        outlined dense
        :type="showNew ? 'text' : 'password'"
        label="New Password (min 8 characters)"
        class="q-mb-md"
        :disable="loading"
        @keyup.enter="handleChange"
      >
        <template #prepend><q-icon name="lock_open" /></template>
        <template #append>
          <q-icon :name="showNew ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="showNew = !showNew" />
        </template>
      </q-input>

      <div v-if="errorMsg" class="q-mb-md text-negative text-caption text-center">
        <q-icon name="error" size="16px" class="q-mr-xs" />{{ errorMsg }}
      </div>

      <q-btn
        class="btn-bee full-width"
        size="lg"
        no-caps
        label="Update Password"
        :loading="loading"
        :disable="!currentPassword || newPassword.length < 8"
        @click="handleChange"
      />
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { Notify } from 'quasar'

const router = useRouter()
const authStore = useAuthStore()

const currentPassword = ref('')
const newPassword = ref('')
const showCurrent = ref(false)
const showNew = ref(false)
const loading = ref(false)
const errorMsg = ref('')

async function handleChange() {
  if (!currentPassword.value || newPassword.value.length < 8) return
  loading.value = true
  errorMsg.value = ''

  try {
    await authStore.changePassword(currentPassword.value, newPassword.value)
    Notify.create({ type: 'positive', message: 'Password updated!' })
    router.push('/workspace')
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.error || err?.response?.data?.message || 'Failed to change password'
  } finally {
    loading.value = false
  }
}
</script>
