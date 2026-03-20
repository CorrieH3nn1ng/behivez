<template>
  <div class="flex flex-center" style="min-height: 100vh; background: linear-gradient(160deg, #fffbeb 0%, #fef3c7 100%)">
    <q-card style="width: 400px; max-width: 90vw" class="q-pa-lg">
      <q-card-section class="text-center">
        <q-icon name="hive" size="36px" color="amber" class="q-mb-sm" />
        <div class="text-h4 text-primary text-weight-bold q-mb-xs">Pollenz</div>
        <div class="text-caption text-grey-6 q-mb-sm">by <span class="text-amber-8">BeHivez</span></div>
        <div class="text-subtitle2 text-grey-7">Sign in to your account</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="handleLogin" class="q-gutter-md">
          <q-input
            v-model="email"
            label="Email"
            type="email"
            outlined
            dense
            :rules="[val => !!val || 'Required']"
          />
          <q-input
            v-model="password"
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            outlined
            dense
            :rules="[val => !!val || 'Required']"
          >
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
            label="Sign In"
            color="primary"
            class="full-width"
            :loading="loading"
            unelevated
          />
        </q-form>
      </q-card-section>

      <q-card-section class="text-center q-pt-none">
        <router-link to="/forgot-password" class="text-grey-7 text-caption">
          Forgot your password?
        </router-link>
      </q-card-section>

      <q-card-section class="text-center q-pt-none">
        <router-link to="/register" class="text-primary">
          Don't have an account? Register
        </router-link>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useUserStore } from '@/stores/user.store';

const router = useRouter();
const route = useRoute();
const $q = useQuasar();
const userStore = useUserStore();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);

async function handleLogin() {
  loading.value = true;
  try {
    const user = await userStore.login(email.value, password.value);
    if (user.mustChangePassword) {
      router.push('/change-password');
    } else {
      const redirect = (route.query.redirect as string) || '/';
      router.push(redirect);
    }
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
    $q.notify({ type: 'negative', message });
  } finally {
    loading.value = false;
  }
}
</script>
