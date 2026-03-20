<template>
  <q-page class="honeycomb-bg flex flex-center" style="min-height: 80vh;">
    <q-card flat class="bee-card q-pa-xl text-center" style="max-width: 420px; width: 100%;">
      <q-icon name="hive" size="48px" color="amber" class="q-mb-md" />
      <h2 class="text-h5 text-weight-bold q-mb-xs">Welcome Back</h2>
      <p class="text-grey-7 q-mb-lg" style="font-size: 14px;">Enter your email to receive a magic login link.</p>

      <template v-if="!sent">
        <q-input
          v-model="email"
          outlined
          type="email"
          label="Email address"
          class="q-mb-md"
          :rules="[val => !!val || 'Email required', val => /.+@.+\..+/.test(val) || 'Invalid email']"
          @keyup.enter="sendLink"
        >
          <template #prepend><q-icon name="email" /></template>
        </q-input>
        <q-btn
          class="btn-bee full-width"
          no-caps
          label="Send Magic Link"
          :loading="loading"
          @click="sendLink"
        />
      </template>

      <template v-else>
        <q-icon name="mark_email_read" size="56px" color="positive" class="q-mb-md" />
        <p class="text-subtitle1 text-weight-bold">Check your email</p>
        <p class="text-grey-7" style="font-size: 13px;">
          We've sent a login link to <strong>{{ email }}</strong>. Click it to sign in.
        </p>
        <q-btn flat no-caps color="grey-7" label="Use a different email" @click="sent = false" class="q-mt-md" />
      </template>

      <q-separator class="q-my-lg" />
      <q-btn flat no-caps color="grey-7" label="Just do a quick check (no account)" to="/quick-check" />
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { Notify } from 'quasar'

const authStore = useAuthStore()
const email = ref('')
const loading = ref(false)
const sent = ref(false)

async function sendLink() {
  if (!email.value || !/.+@.+\..+/.test(email.value)) return
  loading.value = true
  try {
    await authStore.sendMagicLink(email.value)
    sent.value = true
  } catch {
    Notify.create({ type: 'negative', message: 'Failed to send magic link. Try again.' })
  } finally {
    loading.value = false
  }
}
</script>
