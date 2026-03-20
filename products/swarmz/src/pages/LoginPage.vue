<template>
  <q-page class="flex flex-center bg-grey-2">
    <q-card class="q-pa-lg" style="width: 400px; max-width: 90vw; border-radius: 12px;">
      <q-card-section class="text-center">
        <div class="text-h4 text-primary q-mb-xs">Swarmz</div>
        <div class="text-subtitle1 text-grey-7">Vehicle Cost Tracker</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="handleLogin">
          <q-input v-model="email" type="email" label="Email" outlined class="q-mb-md" :rules="[v => !!v || 'Required']">
            <template v-slot:prepend><q-icon name="email" /></template>
          </q-input>
          <q-input v-model="password" :type="showPw ? 'text' : 'password'" label="Password" outlined class="q-mb-md" :rules="[v => !!v || 'Required']">
            <template v-slot:prepend><q-icon name="lock" /></template>
            <template v-slot:append><q-icon :name="showPw ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="showPw = !showPw" /></template>
          </q-input>
          <q-btn type="submit" color="primary" class="full-width q-mt-sm" size="lg" :loading="authStore.isLoading" label="Login" />
        </q-form>
      </q-card-section>

      <q-card-section class="text-center q-pt-none">
        <q-separator class="q-my-md" />
        <q-btn outline color="secondary" class="full-width q-mb-sm" icon="play_arrow" label="Try Demo" @click="enterDemo" />
        <div class="text-caption text-grey-6">
          No account? <router-link :to="{ name: 'register' }" class="text-primary">Create one</router-link>
        </div>
      </q-card-section>

      <q-card-section v-if="error" class="q-pt-none">
        <q-banner class="bg-negative text-white rounded-borders">{{ error }}</q-banner>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from 'stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const email = ref('');
const password = ref('');
const showPw = ref(false);
const error = ref('');

function enterDemo() {
  authStore.enterDemoMode();
  router.push(route.query.redirect as string || '/');
}

async function handleLogin() {
  error.value = '';
  const result = await authStore.login(email.value, password.value);
  if (result.success) {
    router.push(route.query.redirect as string || '/');
  } else {
    error.value = result.error || 'Login failed';
  }
}
</script>
