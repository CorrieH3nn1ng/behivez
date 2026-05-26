<template>
  <q-page class="flex column items-center q-pa-md" style="background: #fef9f0; min-height: 100vh;">

    <!-- Header -->
    <div class="text-center q-mt-xl q-mb-lg">
      <div class="text-h4 text-weight-bold" style="color: #78350f;">
        {{ lang === 'af' ? 'Kies Jou Plan' : 'Choose Your Plan' }}
      </div>
      <div class="text-body1 text-grey-7 q-mt-xs">
        {{ lang === 'af'
          ? 'KI-gegenereerde toetse, studie-modus en vorderingsnasporing vir elke leerder'
          : 'AI-generated tests, study mode and progress tracking for every learner' }}
      </div>
    </div>

    <!-- Plan cards -->
    <div class="row q-gutter-md justify-center" style="max-width: 960px; width: 100%;">

      <!-- R29 Per Subject -->
      <q-card flat bordered class="plan-card col-12 col-sm-auto cursor-pointer"
        :class="selectedPlan === 'per_subject' ? 'plan-selected' : ''"
        @click="selectPlan('per_subject')">
        <q-card-section class="text-center q-pb-xs">
          <div class="text-overline text-amber-9">{{ lang === 'af' ? '1 VAK' : '1 SUBJECT' }}</div>
          <div class="text-h3 text-weight-bold" style="color: #78350f;">R29</div>
          <div class="text-caption text-grey-6">/{{ lang === 'af' ? 'maand' : 'month' }}</div>
        </q-card-section>
        <q-card-section>
          <q-list dense>
            <q-item v-for="f in perSubjectFeatures" :key="f" dense>
              <q-item-section avatar><q-icon name="check_circle" color="amber-8" size="18px" /></q-item-section>
              <q-item-section class="text-body2">{{ f }}</q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
        <q-card-section class="q-pt-none text-center">
          <q-chip v-if="selectedPlan === 'per_subject'" color="amber-8" text-color="white" icon="check">
            {{ lang === 'af' ? 'Gekies' : 'Selected' }}
          </q-chip>
          <q-btn v-else flat no-caps color="amber-8" :label="lang === 'af' ? 'Kies' : 'Select'" />
        </q-card-section>
      </q-card>

      <!-- R69 3 Subjects -->
      <q-card flat bordered class="plan-card col-12 col-sm-auto cursor-pointer plan-popular"
        :class="selectedPlan === 'three_subjects' ? 'plan-selected' : ''"
        @click="selectPlan('three_subjects')">
        <div class="popular-badge">{{ lang === 'af' ? 'GEWILD' : 'POPULAR' }}</div>
        <q-card-section class="text-center q-pb-xs">
          <div class="text-overline text-amber-9">{{ lang === 'af' ? '3 VAKKE' : '3 SUBJECTS' }}</div>
          <div class="text-h3 text-weight-bold" style="color: #78350f;">R69</div>
          <div class="text-caption text-grey-6">/{{ lang === 'af' ? 'maand' : 'month' }}</div>
        </q-card-section>
        <q-card-section>
          <q-list dense>
            <q-item v-for="f in threeSubjectFeatures" :key="f" dense>
              <q-item-section avatar><q-icon name="check_circle" color="amber-8" size="18px" /></q-item-section>
              <q-item-section class="text-body2">{{ f }}</q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
        <q-card-section class="q-pt-none text-center">
          <q-chip v-if="selectedPlan === 'three_subjects'" color="amber-8" text-color="white" icon="check">
            {{ lang === 'af' ? 'Gekies' : 'Selected' }}
          </q-chip>
          <q-btn v-else flat no-caps color="amber-8" :label="lang === 'af' ? 'Kies' : 'Select'" />
        </q-card-section>
      </q-card>

      <!-- R99 All Subjects -->
      <q-card flat bordered class="plan-card col-12 col-sm-auto cursor-pointer"
        :class="selectedPlan === 'all_subjects' ? 'plan-selected' : ''"
        @click="selectPlan('all_subjects')">
        <q-card-section class="text-center q-pb-xs">
          <div class="text-overline text-amber-9">{{ lang === 'af' ? 'ALLE VAKKE' : 'ALL SUBJECTS' }}</div>
          <div class="text-h3 text-weight-bold" style="color: #78350f;">R99</div>
          <div class="text-caption text-grey-6">/{{ lang === 'af' ? 'maand' : 'month' }}</div>
        </q-card-section>
        <q-card-section>
          <q-list dense>
            <q-item v-for="f in allSubjectFeatures" :key="f" dense>
              <q-item-section avatar><q-icon name="check_circle" color="amber-8" size="18px" /></q-item-section>
              <q-item-section class="text-body2">{{ f }}</q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
        <q-card-section class="q-pt-none text-center">
          <q-chip v-if="selectedPlan === 'all_subjects'" color="amber-8" text-color="white" icon="check">
            {{ lang === 'af' ? 'Gekies' : 'Selected' }}
          </q-chip>
          <q-btn v-else flat no-caps color="amber-8" :label="lang === 'af' ? 'Kies' : 'Select'" />
        </q-card-section>
      </q-card>
    </div>

    <!-- Subject selector (for per_subject and three_subjects) -->
    <q-card v-if="selectedPlan === 'per_subject' || selectedPlan === 'three_subjects'"
      flat bordered class="q-mt-lg q-pa-md" style="max-width: 680px; width: 100%; background: #fffdf7;">
      <div class="text-subtitle1 text-weight-bold q-mb-sm" style="color: #78350f;">
        {{ selectedPlan === 'per_subject'
          ? (lang === 'af' ? 'Kies 1 Vak' : 'Choose 1 Subject')
          : (lang === 'af' ? 'Kies 3 Vakke' : 'Choose 3 Subjects') }}
      </div>
      <div class="row q-gutter-sm">
        <q-btn v-for="s in availableSubjects" :key="s.code"
          :outline="!selectedSubjects.includes(s.code)"
          :color="selectedSubjects.includes(s.code) ? 'amber-8' : 'grey-5'"
          no-caps rounded size="sm"
          :label="lang === 'af' ? s.labelAf : s.labelEn"
          :icon="selectedSubjects.includes(s.code) ? 'check' : ''"
          @click="toggleSubject(s.code)" />
      </div>
      <div v-if="subjectError" class="text-red-7 text-caption q-mt-sm">{{ subjectError }}</div>
    </q-card>

    <!-- Not logged in warning -->
    <q-banner v-if="!authStore.isLoggedIn" class="q-mt-lg bg-amber-1 text-amber-9" rounded style="max-width: 680px; width: 100%;">
      <template #avatar><q-icon name="info" color="amber-8" /></template>
      {{ lang === 'af'
        ? 'Jy moet eers aanmeld of registreer voor jy kan inskryf.'
        : 'You need to sign in or register before subscribing.' }}
      <template #action>
        <q-btn flat no-caps color="amber-8" :label="lang === 'af' ? 'Aanmeld' : 'Sign In'"
          :to="{ name: 'get-started', query: { redirect: '/subscribe' } }" />
      </template>
    </q-banner>

    <!-- Error -->
    <q-banner v-if="error" class="q-mt-md bg-red-1 text-red-8" rounded style="max-width: 680px; width: 100%;">
      <template #avatar><q-icon name="error" color="red" /></template>
      {{ error }}
    </q-banner>

    <!-- Subscribe button -->
    <q-btn v-if="selectedPlan && authStore.isLoggedIn"
      class="btn-bee q-mt-xl q-px-xl" size="lg" no-caps
      :loading="loading"
      :label="lang === 'af' ? `Inskryf vir R${planPrice}/maand` : `Subscribe for R${planPrice}/month`"
      @click="subscribe" />

    <!-- Hidden PayFast form -->
    <form ref="payfastForm" method="POST" :action="payfastUrl" style="display: none;">
      <input v-for="(v, k) in payfastFields" :key="k" type="hidden" :name="k" :value="v" />
    </form>

    <!-- Free note -->
    <div class="text-caption text-grey-6 q-mt-lg text-center">
      {{ lang === 'af'
        ? 'Maaltafeltoetse en spoedoefeninge bly altyd gratis. Kanselleer enige tyd.'
        : 'Speed drills and multiplication tests stay free forever. Cancel any time.' }}
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'src/i18n'
import { useAuthStore } from 'src/stores/auth'
import { backendApi } from 'src/boot/axios'

const { lang } = useI18n()
const authStore = useAuthStore()

const selectedPlan = ref<string>('')
const selectedSubjects = ref<string[]>([])
const loading = ref(false)
const error = ref('')
const subjectError = ref('')
const payfastUrl = ref('')
const payfastFields = ref<Record<string, string>>({})
const payfastForm = ref<HTMLFormElement | null>(null)

const availableSubjects = [
  { code: 'natural_science',   labelEn: 'Natural Science',    labelAf: 'Natuurwetenskap' },
  { code: 'mathematics',       labelEn: 'Mathematics',         labelAf: 'Wiskunde' },
  { code: 'life_orientation',  labelEn: 'Life Orientation',    labelAf: 'Lewensoriëntering' },
  { code: 'social_sciences',   labelEn: 'Social Sciences',     labelAf: 'Sosiale Wetenskappe' },
  { code: 'ems',               labelEn: 'EMS',                 labelAf: 'EBW' },
  { code: 'technology',        labelEn: 'Technology',          labelAf: 'Tegnologie' },
  { code: 'creative_arts',     labelEn: 'Creative Arts',       labelAf: 'Skeppende Kunste' },
  { code: 'egd',               labelEn: 'EGD (Gr 8-12)',       labelAf: 'Ingenieurstekene (Gr 8-12)' },
  { code: 'english',           labelEn: 'English HL',          labelAf: 'Engels HT' },
  { code: 'afrikaans',         labelEn: 'Afrikaans HL',        labelAf: 'Afrikaans HT' },
  { code: 'life_skills',       labelEn: 'Life Skills (Gr 1-3)', labelAf: 'Lewensvaardighede (Gr 1-3)' },
]

const perSubjectFeatures = computed(() => lang.value === 'af'
  ? ['KI-toetse vir 1 vak', 'Studie-modus (konsepkaarte)', 'Vorderingsnasporing', '1 kinderprofiel']
  : ['AI tests for 1 subject', 'Study mode (concept cards)', 'Progress tracking', '1 child profile'])

const threeSubjectFeatures = computed(() => lang.value === 'af'
  ? ['KI-toetse vir 3 vakke', 'Studie-modus (konsepkaarte)', 'Vorderingsnasporing', 'Onbeperkte kinderprofiele']
  : ['AI tests for 3 subjects', 'Study mode (concept cards)', 'Progress tracking', 'Unlimited child profiles'])

const allSubjectFeatures = computed(() => lang.value === 'af'
  ? ['Alle vakke ontsluit', 'KI-toetse + studie-modus', 'Onbeperkte kinderprofiele', 'Vorderingsnasporing', 'Prioriteit ondersteuning']
  : ['Every subject unlocked', 'AI tests + study mode', 'Unlimited child profiles', 'Progress tracking', 'Priority support'])

const planPrice = computed(() => {
  if (selectedPlan.value === 'per_subject') return 29
  if (selectedPlan.value === 'three_subjects') return 69
  if (selectedPlan.value === 'all_subjects') return 99
  return 0
})

const requiredSubjectCount = computed(() => {
  if (selectedPlan.value === 'per_subject') return 1
  if (selectedPlan.value === 'three_subjects') return 3
  return 0
})

function selectPlan(plan: string) {
  selectedPlan.value = plan
  selectedSubjects.value = []
  subjectError.value = ''
  error.value = ''
}

function toggleSubject(code: string) {
  const max = requiredSubjectCount.value
  if (selectedSubjects.value.includes(code)) {
    selectedSubjects.value = selectedSubjects.value.filter(s => s !== code)
  } else {
    if (selectedSubjects.value.length >= max) {
      selectedSubjects.value = [selectedSubjects.value.slice(1), code].flat()
    } else {
      selectedSubjects.value.push(code)
    }
  }
  subjectError.value = ''
}

async function subscribe() {
  error.value = ''
  subjectError.value = ''

  if ((selectedPlan.value === 'per_subject' && selectedSubjects.value.length !== 1) ||
      (selectedPlan.value === 'three_subjects' && selectedSubjects.value.length !== 3)) {
    subjectError.value = lang.value === 'af'
      ? `Kies asseblief ${requiredSubjectCount.value} vak${requiredSubjectCount.value > 1 ? 'ke' : ''}`
      : `Please choose ${requiredSubjectCount.value} subject${requiredSubjectCount.value > 1 ? 's' : ''}`
    return
  }

  loading.value = true
  try {
    const { data } = await backendApi.post('/payments/subscribe', {
      plan: selectedPlan.value,
      subjects: selectedSubjects.value,
    })
    payfastUrl.value = data.payfast_url
    payfastFields.value = data.fields
    await new Promise(r => setTimeout(r, 50))
    payfastForm.value?.submit()
  } catch (err: any) {
    error.value = err.response?.data?.message || (lang.value === 'af' ? 'Kon nie verwerk nie' : 'Could not process subscription')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.plan-card {
  width: 280px;
  border-radius: 16px !important;
  border-color: #e9d8b4 !important;
  background: white;
  transition: all 0.2s;
  position: relative;
  overflow: visible;
}
.plan-card:hover {
  border-color: #d97706 !important;
  box-shadow: 0 4px 20px rgba(217, 119, 6, 0.15);
}
.plan-selected {
  border-color: #d97706 !important;
  border-width: 2px !important;
  box-shadow: 0 4px 20px rgba(217, 119, 6, 0.2);
}
.plan-popular {
  border-color: #d97706 !important;
}
.popular-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #d97706;
  color: white;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 2px 12px;
  border-radius: 20px;
}
</style>
