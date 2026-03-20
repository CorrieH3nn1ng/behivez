<template>
  <q-page class="flex flex-center bg-grey-2">
    <q-card class="q-pa-lg" style="width: 440px; max-width: 90vw; border-radius: 12px;">
      <q-card-section class="text-center">
        <div class="text-h4 text-primary q-mb-xs">Swarmz</div>
        <div class="text-subtitle1 text-grey-7">Create your account</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="handleRegister">
          <q-input v-model="name" label="Full Name" outlined class="q-mb-md" :rules="[v => !!v || 'Required']">
            <template v-slot:prepend><q-icon name="person" /></template>
          </q-input>
          <q-input v-model="email" type="email" label="Email" outlined class="q-mb-md" :rules="[v => !!v || 'Required']">
            <template v-slot:prepend><q-icon name="email" /></template>
          </q-input>
          <q-input v-model="password" :type="showPw ? 'text' : 'password'" label="Password" outlined class="q-mb-md" :rules="[v => v.length >= 6 || 'Min 6 characters']">
            <template v-slot:prepend><q-icon name="lock" /></template>
            <template v-slot:append><q-icon :name="showPw ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="showPw = !showPw" /></template>
          </q-input>

          <div class="text-caption text-grey-7 q-mb-sm">Choose your plan</div>
          <div class="row q-gutter-sm q-mb-lg">
            <q-card
              v-for="p in plans" :key="p.value"
              flat bordered
              class="col cursor-pointer plan-card"
              :class="{ 'plan-card-selected': plan === p.value }"
              @click="plan = p.value"
            >
              <q-card-section class="text-center q-pa-sm">
                <q-icon :name="p.icon" size="28px" :color="plan === p.value ? 'primary' : 'grey-5'" />
                <div class="text-subtitle2 q-mt-xs">{{ p.label }}</div>
                <div class="text-caption text-grey-6">{{ p.desc }}</div>
              </q-card-section>
            </q-card>
          </div>

          <q-btn type="submit" color="primary" class="full-width" size="lg" :loading="authStore.isLoading" label="Create Account" />
        </q-form>
      </q-card-section>

      <q-card-section class="text-center q-pt-none">
        <div class="text-caption text-grey-6">
          Already have an account? <router-link to="/login" class="text-primary">Login</router-link>
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
import { useRouter } from 'vue-router';
import { useAuthStore } from 'stores/auth';
import type { PlanType } from 'src/types';

const router = useRouter();
const authStore = useAuthStore();
const name = ref('');
const email = ref('');
const password = ref('');
const showPw = ref(false);
const plan = ref<PlanType>('solo');
const error = ref('');

const plans = [
  { value: 'solo' as PlanType, label: 'Solo', desc: 'My personal vehicle(s)', icon: 'directions_car' },
  { value: 'fleet' as PlanType, label: 'Fleet', desc: 'Manage a small fleet', icon: 'local_shipping' },
];

async function handleRegister() {
  error.value = '';
  const result = await authStore.register(name.value, email.value, password.value, plan.value);
  if (result.success) {
    router.push('/');
  } else {
    error.value = result.error || 'Registration failed';
  }
}
</script>

<style scoped>
.plan-card { border-radius: 10px; transition: border-color 0.2s; }
.plan-card-selected { border-color: #f59e0b; border-width: 2px; background: #fffbeb; }
</style>
