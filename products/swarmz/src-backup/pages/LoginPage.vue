<template>
  <q-page class="flex flex-center bg-grey-2">
    <q-card class="login-card q-pa-lg" style="width: 400px; max-width: 90vw;">
      <q-card-section class="text-center">
        <div class="text-h4 text-primary q-mb-md">Swarmz</div>
        <div class="text-subtitle1 text-grey-7">Fleet Operations</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="handleLogin">
          <q-input
            v-model="email"
            type="email"
            label="Email"
            outlined
            class="q-mb-md"
            :rules="[val => !!val || 'Email is required']"
          >
            <template v-slot:prepend>
              <q-icon name="email" />
            </template>
          </q-input>

          <q-input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            label="Password"
            outlined
            class="q-mb-md"
            :rules="[val => !!val || 'Password is required']"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
            <template v-slot:append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>

          <q-btn
            type="submit"
            color="primary"
            class="full-width q-mt-md"
            size="lg"
            :loading="authStore.isLoading"
          >
            Login
          </q-btn>
        </q-form>
      </q-card-section>

      <q-card-section class="text-center">
        <q-separator class="q-my-md" />
        <div class="text-caption text-grey-6 q-mb-sm">No account yet?</div>
        <q-btn
          outline
          color="secondary"
          class="full-width"
          size="md"
          icon="visibility"
          label="View Demo"
          @click="enterDemo"
        />
      </q-card-section>

      <q-card-section v-if="error" class="text-center">
        <q-banner class="bg-negative text-white">
          {{ error }}
        </q-banner>
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
const showPassword = ref(false);
const error = ref('');

function enterDemo() {
  authStore.enterDemoMode();
  const redirect = route.query.redirect as string || '/';
  router.push(redirect);
}

async function handleLogin() {
  error.value = '';
  const result = await authStore.login(email.value, password.value);

  if (result.success) {
    const redirect = route.query.redirect as string || '/';
    router.push(redirect);
  } else {
    error.value = result.error || 'Login failed';
  }
}
</script>

<style scoped>
.login-card {
  border-radius: 12px;
}
</style>
