<template>
  <q-page class="flex flex-center" style="min-height: 80vh;">
    <q-card flat bordered class="q-pa-xl" style="max-width: 420px; width: 100%;">
      <div class="text-center q-mb-lg">
        <q-icon name="lock" size="48px" color="brown-8" class="q-mb-sm" />
        <h5 class="text-h5 text-weight-bold q-mb-xs q-mt-none">Change Password</h5>
        <p v-if="authStore.mustChangePassword" class="text-warning" style="font-size: 14px;">
          You must change your password before continuing.
        </p>
        <p v-else class="text-grey-7" style="font-size: 14px;">
          Update your account password.
        </p>
      </div>

      <q-input
        v-model="currentPassword"
        outlined dense
        :type="showCurrent ? 'text' : 'password'"
        label="Current password"
        class="q-mb-md"
        :disable="loading"
      >
        <template #prepend><q-icon name="lock_open" /></template>
        <template #append>
          <q-icon :name="showCurrent ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="showCurrent = !showCurrent" />
        </template>
      </q-input>

      <q-input
        v-model="newPassword"
        outlined dense
        :type="showNew ? 'text' : 'password'"
        label="New password"
        class="q-mb-md"
        :disable="loading"
      >
        <template #prepend><q-icon name="lock" /></template>
        <template #append>
          <q-icon :name="showNew ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="showNew = !showNew" />
        </template>
      </q-input>

      <q-input
        v-model="confirmPassword"
        outlined dense
        :type="showNew ? 'text' : 'password'"
        label="Confirm new password"
        class="q-mb-md"
        :disable="loading"
        @keyup.enter="handleChange"
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
        label="Change Password"
        :loading="loading"
        :disable="!canSubmit"
        @click="handleChange"
      />

      <div v-if="!authStore.mustChangePassword" class="text-center q-mt-md">
        <q-btn flat no-caps label="Back to dashboard" color="brown-8" size="sm" to="/dashboard" />
      </div>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { Notify } from 'quasar'

const router = useRouter()
const authStore = useAuthStore()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showCurrent = ref(false)
const showNew = ref(false)
const loading = ref(false)
const errorMsg = ref('')

const canSubmit = computed(() => {
  return currentPassword.value && newPassword.value.length >= 8 && newPassword.value === confirmPassword.value && !loading.value
})

async function handleChange() {
  if (!canSubmit.value) return
  loading.value = true
  errorMsg.value = ''

  try {
    await authStore.changePassword(currentPassword.value, newPassword.value)
    Notify.create({ type: 'positive', message: 'Password changed successfully!' })
    router.push('/dashboard')
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.error || 'Failed to change password. Check your current password.'
  } finally {
    loading.value = false
  }
}
</script>
