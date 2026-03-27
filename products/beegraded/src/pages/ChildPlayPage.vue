<template>
  <q-page class="honeycomb-bg">
    <div class="page-container" style="max-width: 640px;">
      <!-- Loading -->
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner-gears color="amber" size="48px" />
      </div>

      <!-- Not Found -->
      <div v-else-if="error" class="text-center q-pa-xl">
        <q-icon name="link_off" size="64px" color="grey-4" class="q-mb-md" />
        <div class="text-h6 text-grey-6">
          {{ lang === 'af' ? 'Skakel nie gevind nie' : 'Link not found' }}
        </div>
        <div class="text-caption text-grey-5 q-mt-sm">
          {{ lang === 'af' ? 'Vra jou ouer om die skakel weer te stuur.' : 'Ask your parent to send the link again.' }}
        </div>
      </div>

      <!-- Child Profile Loaded -->
      <template v-else-if="child">
        <!-- Language Toggle -->
        <div class="text-right q-mb-sm">
          <q-btn flat dense no-caps size="sm" @click="toggleLanguage" color="grey-7">
            <q-icon name="language" class="q-mr-xs" />
            {{ lang === 'af' ? 'EN' : (lang === 'tn' ? 'AF' : 'TN') }}
          </q-btn>
        </div>

        <!-- Welcome -->
        <div class="text-center q-mb-md">
          <q-icon name="waving_hand" size="48px" color="amber" class="q-mb-xs" />
          <h1 class="text-h4 text-weight-bold q-mb-none" style="color: #1c1917;">
            {{ lang === 'af' ? 'Hallo' : (lang === 'tn' ? 'Dumela' : 'Hello') }}, {{ child.name }}!
          </h1>
          <div class="text-subtitle1 text-grey-7">
            {{ lang === 'af' ? 'Graad' : (lang === 'tn' ? 'Mophato' : 'Grade') }} {{ child.grade }}
          </div>
        </div>

        <!-- Toets My -->
        <div class="text-center q-mb-md">
          <div class="text-h5 text-weight-bold" style="color: #78350f;">
            {{ lang === 'af' ? 'Toets My' : (lang === 'tn' ? 'Ntlhatlhobe' : 'Test Me') }}
          </div>
        </div>

        <!-- Tabs -->
        <q-tabs
          v-model="activeTab"
          dense
          class="text-grey-7 q-mb-md"
          active-color="amber-8"
          indicator-color="amber"
          align="center"
          no-caps
        >
          <q-tab name="maaltafel" :label="lang === 'af' ? 'Maaltafel' : (lang === 'tn' ? 'Tafole' : 'Times Tables')" icon="close" />
          <q-tab name="plusminus" label="Plus Minus" icon="add" />
          <q-tab name="probleemoplossing" :label="lang === 'af' ? 'Probleemoplossing' : (lang === 'tn' ? 'Tharabololo' : 'Problem Solving')" icon="psychology" />
        </q-tabs>

        <q-tab-panels v-model="activeTab" animated>
          <!-- Maaltafel -->
          <q-tab-panel name="maaltafel" class="q-pa-none">
            <q-card flat class="bee-card q-pa-md q-mb-md">
              <div class="text-caption text-grey-6 q-mb-sm text-center">
                50 {{ lang === 'af' ? 'vrae' : 'questions' }} &bull; 6 {{ lang === 'af' ? 'minute' : 'minutes' }} &bull; &times; {{ lang === 'af' ? 'en' : 'and' }} &divide;
              </div>
              <q-btn class="btn-bee full-width" size="lg" no-caps :loading="generating" @click="startTest('maaltafel')" icon="flash_on">
                {{ lang === 'af' ? 'Begin Toets' : (lang === 'tn' ? 'Simolola' : 'Start Test') }}
              </q-btn>
            </q-card>
          </q-tab-panel>

          <!-- Plus Minus -->
          <q-tab-panel name="plusminus" class="q-pa-none">
            <q-card flat class="bee-card q-pa-md q-mb-md">
              <div class="text-caption text-grey-6 q-mb-sm text-center">
                50 {{ lang === 'af' ? 'vrae' : 'questions' }} &bull; 6 {{ lang === 'af' ? 'minute' : 'minutes' }} &bull; + {{ lang === 'af' ? 'en' : 'and' }} &minus;
              </div>
              <q-btn class="btn-bee full-width" size="lg" no-caps :loading="generating" @click="startTest('plusminus')" icon="flash_on">
                {{ lang === 'af' ? 'Begin Toets' : (lang === 'tn' ? 'Simolola' : 'Start Test') }}
              </q-btn>
            </q-card>
          </q-tab-panel>

          <!-- Probleemoplossing -->
          <q-tab-panel name="probleemoplossing" class="q-pa-none">
            <q-card flat class="bee-card q-pa-md q-mb-md">
              <div class="text-caption text-grey-6 q-mb-xs text-center">
                20 {{ lang === 'af' ? 'vrae' : 'questions' }} &bull; 60 {{ lang === 'af' ? 'minute' : 'minutes' }} &bull;
                {{ lang === 'af' ? 'Meervoudige keuse' : 'Multiple choice' }} (A-E)
              </div>
              <div class="text-caption text-grey-5 q-mb-sm text-center">
                <q-icon name="calculate" size="14px" class="q-mr-xs" />
                {{ lang === 'af' ? 'Sakrekenaar toegelaat' : 'Calculator allowed' }}
              </div>
              <q-btn class="btn-bee full-width" size="lg" no-caps :loading="generatingProblems" @click="startProblemTest" icon="psychology">
                {{ lang === 'af' ? 'Begin Toets' : (lang === 'tn' ? 'Simolola' : 'Start Test') }}
              </q-btn>
              <div v-if="generatingProblems" class="text-caption text-grey-5 text-center q-mt-sm">
                {{ lang === 'af' ? 'KI genereer vrae...' : 'AI generating questions...' }}
              </div>
            </q-card>
          </q-tab-panel>
        </q-tab-panels>

        <!-- Recent Scores -->
        <q-card v-if="child.recent_attempts && child.recent_attempts.length > 0" flat class="bee-card q-pa-md q-mb-md">
          <div class="text-weight-bold q-mb-sm">
            <q-icon name="history" class="q-mr-xs" />
            {{ lang === 'af' ? 'Onlangse Toetse' : 'Recent Tests' }}
          </div>
          <q-list dense separator>
            <q-item v-for="a in child.recent_attempts" :key="a.id">
              <q-item-section>
                <q-item-label>{{ a.template_name }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge :color="a.percentage >= 80 ? 'positive' : a.percentage >= 50 ? 'warning' : 'grey'">
                  {{ a.score }}/{{ a.total }} ({{ a.percentage }}%)
                </q-badge>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'src/i18n'
import { useChildren } from 'src/composables/useChildren'
import { useMathTest } from 'src/composables/useMathTest'
import { useMathTestStore } from 'src/stores/math-test'
import { Notify } from 'quasar'

const { lang, toggleLanguage, setLanguage } = useI18n()
const { getChildBySlug } = useChildren()
const { generateTest, generateProblems } = useMathTest()
const store = useMathTestStore()
const route = useRoute()
const router = useRouter()

const child = ref<any>(null)
const loading = ref(true)
const error = ref(false)
const activeTab = ref('maaltafel')
const generating = ref(false)
const generatingProblems = ref(false)

async function startTest(mode: 'maaltafel' | 'plusminus') {
  generating.value = true
  try {
    const config: any = { grade: child.value.grade, language: lang.value }
    if (mode === 'plusminus') config.operations = ['add', 'subtract']
    const template = await generateTest(config)

    // Set player name and child_id in store
    store.setPlayerName(child.value.name)

    router.push({
      name: 'math-test',
      params: { templateId: template.id },
      query: { childId: child.value.id, returnTo: route.fullPath },
    })
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err.response?.data?.message || 'Failed to generate test' })
  } finally {
    generating.value = false
  }
}

async function startProblemTest() {
  generatingProblems.value = true
  try {
    const template = await generateProblems({ grade: child.value.grade, language: lang.value })
    store.setPlayerName(child.value.name)
    router.push({
      name: 'math-problems',
      params: { templateId: template.id },
      query: { childId: child.value.id, returnTo: route.fullPath },
    })
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err.response?.data?.message || 'Failed to generate test' })
  } finally {
    generatingProblems.value = false
  }
}

onMounted(async () => {
  const slug = route.params.slug as string
  if (!slug) {
    error.value = true
    loading.value = false
    return
  }

  try {
    child.value = await getChildBySlug(slug)
    // Set language from child profile
    if (child.value.language) {
      setLanguage(child.value.language)
    }
    store.setPlayerName(child.value.name)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})
</script>
