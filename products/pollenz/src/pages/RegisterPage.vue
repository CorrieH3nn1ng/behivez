<template>
  <div class="flex flex-center" style="min-height: 100vh; background: linear-gradient(160deg, #fffbeb 0%, #fef3c7 100%)">
    <q-card style="width: 400px; max-width: 90vw" class="q-pa-lg">
      <q-card-section class="text-center">
        <q-icon name="hive" size="36px" color="amber" class="q-mb-sm" />
        <div class="text-h4 text-primary text-weight-bold q-mb-xs">Pollenz</div>
        <div class="text-caption text-grey-6 q-mb-sm">by <span class="text-amber-8">BeHivez</span></div>
        <div class="text-subtitle2 text-grey-7">Create your account</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="handleRegister" class="q-gutter-md">
          <q-input v-model="name" label="Full Name" outlined dense :rules="[val => !!val || 'Required']" />
          <q-input v-model="email" label="Email" type="email" outlined dense :rules="[val => !!val || 'Required']" />
          <q-input v-model="password" label="Password" type="password" outlined dense
            :rules="[val => val.length >= 8 || 'Min 8 characters']" />
          <q-input v-model="passwordConfirm" label="Confirm Password" type="password" outlined dense
            :rules="[val => val === password || 'Passwords must match']" />

          <q-btn type="submit" label="Register" color="primary" class="full-width" :loading="loading" unelevated />
        </q-form>
      </q-card-section>

      <q-card-section class="text-center">
        <router-link to="/login" class="text-primary">Already have an account? Sign in</router-link>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useUserStore } from '@/stores/user.store';

const router = useRouter();
const $q = useQuasar();
const userStore = useUserStore();

const name = ref('');
const email = ref('');
const password = ref('');
const passwordConfirm = ref('');
const loading = ref(false);

async function handleRegister() {
  loading.value = true;
  try {
    await userStore.register(name.value, email.value, password.value);
    $q.notify({ type: 'positive', message: 'Account created!' });
    router.push('/');
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
    $q.notify({ type: 'negative', message });
  } finally {
    loading.value = false;
  }
}
</script>
