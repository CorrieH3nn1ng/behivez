<template>
  <q-page padding class="flex flex-center">
    <div style="max-width: 560px; width: 100%;">
      <div class="text-center q-mb-lg">
        <q-icon name="directions_car" size="48px" color="primary" />
        <div class="text-h5 text-weight-bold q-mt-sm">What will you use Swarmz for?</div>
        <div class="text-grey-7" style="font-size: 14px;">
          We'll set things up to suit you. You can change any of this later in Settings — nothing is locked in.
        </div>
      </div>

      <q-list bordered separator class="rounded-borders">
        <q-item
          v-for="opt in availableOptions"
          :key="opt.value"
          clickable
          v-ripple
          :disable="saving"
          @click="choose(opt.value)"
        >
          <q-item-section avatar>
            <q-avatar :color="opt.color" text-color="white" :icon="opt.icon" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bold">{{ opt.title }}</q-item-label>
            <q-item-label caption>{{ opt.subtitle }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" />
          </q-item-section>
        </q-item>
      </q-list>

      <div class="text-center text-caption text-grey-5 q-mt-lg">
        No SARS, no notifications, no clutter — unless you turn them on.
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'stores/auth';
import { useSettingsStore, type Persona } from 'stores/settings';

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();
const settings = useSettingsStore();
const saving = ref(false);

// Make sure we know the signed-in user (and their plan) — hydrate from the
// shared-auth session if the store hasn't been populated yet.
onMounted(() => {
  if (!authStore.user) authStore.loadFromStorage();
});

// The plan/entitlement is owned by the shared BeHivez auth (chosen at register,
// tied to the central subscription). Onboarding only presets feature toggles —
// it must never grant Fleet to an account that isn't on the Fleet plan.
const isFleetAccount = computed(() => authStore.user?.plan === 'fleet');

const options: { value: Persona; title: string; subtitle: string; icon: string; color: string }[] = [
  {
    value: 'just_my_car',
    title: 'Just track my car',
    subtitle: 'Log fuel & expenses, snap slips with AI. Simple and clean.',
    icon: 'directions_car',
    color: 'primary',
  },
  {
    value: 'self_employed',
    title: "I'm self-employed / claim tax",
    subtitle: 'Adds the travel logbook & SARS tax report to claim deductions.',
    icon: 'receipt_long',
    color: 'teal',
  },
  {
    value: 'fleet',
    title: 'I run a fleet',
    subtitle: 'Adds drivers, vehicle status workflow and multi-vehicle tools.',
    icon: 'local_shipping',
    color: 'deep-orange',
  },
];

// Fleet setup only offered to accounts registered on the Fleet plan.
const availableOptions = computed(() =>
  options.filter((o) => o.value !== 'fleet' || isFleetAccount.value)
);

async function choose(persona: Persona) {
  saving.value = true;
  try {
    await settings.applyPersona(persona);
    router.replace({ name: 'dashboard' });
  } catch {
    $q.notify({ type: 'negative', message: 'Could not save your choice. Please try again.' });
  } finally {
    saving.value = false;
  }
}
</script>
