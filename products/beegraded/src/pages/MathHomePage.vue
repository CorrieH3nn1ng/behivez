<template>
  <q-page class="honeycomb-bg">
    <div class="page-container" style="max-width: 640px;">
      <!-- Language Toggle -->
      <div class="text-right q-mb-sm">
        <q-btn flat dense no-caps size="sm" @click="toggleLanguage" color="grey-7">
          <q-icon name="language" class="q-mr-xs" />
          {{ lang === 'af' ? 'EN' : 'AF' }}
        </q-btn>
      </div>

      <!-- Hero -->
      <div class="text-center q-mb-md">
        <q-icon name="calculate" size="48px" color="amber" class="q-mb-xs" />
        <h1 class="text-h4 text-weight-bold q-mb-none" style="color: #1c1917;">
          {{ lang === 'af' ? 'Toets My' : 'Test Me' }}
        </h1>
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
        <q-tab name="maaltafel" :label="lang === 'af' ? 'Maaltafel' : 'Times Tables'" icon="close" />
        <q-tab name="plusminus" :label="lang === 'af' ? 'Plus Minus' : 'Plus Minus'" icon="add" />
        <q-tab name="probleemoplossing" :label="lang === 'af' ? 'Probleemoplossing' : 'Problem Solving'" icon="psychology" />
      </q-tabs>

      <!-- Tab: Maaltafel -->
      <q-tab-panels v-model="activeTab" animated>
        <q-tab-panel name="maaltafel" class="q-pa-none">
          <!-- Player Name -->
          <q-card flat class="bee-card q-pa-md q-mb-md" v-if="!store.playerName">
            <q-input
              v-model="nameInput"
              outlined
              :label="t('player_name')"
              @keydown.enter="saveName"
              class="q-mb-sm"
            >
              <template #prepend><q-icon name="person" /></template>
            </q-input>
            <q-btn class="btn-bee full-width" no-caps @click="saveName" :disable="!nameInput.trim()">
              {{ lang === 'af' ? 'Stoor' : 'Save' }}
            </q-btn>
          </q-card>

          <!-- Grade + Start -->
          <q-card flat class="bee-card q-pa-md q-mb-md" v-if="store.playerName">
            <div class="row items-center q-mb-sm">
              <q-icon name="person" color="amber-8" size="20px" class="q-mr-sm" />
              <span class="text-weight-bold">{{ store.playerName }}</span>
              <q-space />
              <q-btn flat dense size="sm" icon="edit" @click="editName = true" />
            </div>

            <div v-if="editName" class="q-mb-sm">
              <q-input v-model="nameInput" outlined dense :label="t('player_name')" class="q-mb-xs">
                <template #append>
                  <q-btn flat dense icon="check" color="positive" @click="saveName" />
                  <q-btn flat dense icon="close" color="grey" @click="editName = false" />
                </template>
              </q-input>
            </div>

            <q-select
              v-model="selectedGrade"
              outlined
              :label="t('grade')"
              :options="gradeOptions"
              emit-value
              map-options
              class="q-mb-md"
            />

            <div class="text-caption text-grey-6 q-mb-sm text-center">
              50 {{ lang === 'af' ? 'vrae' : 'questions' }} &bull; 6 {{ t('minutes') }} &bull; &times; {{ lang === 'af' ? 'en' : 'and' }} &divide;
            </div>

            <q-btn
              class="btn-bee full-width"
              size="lg"
              no-caps
              :loading="generating"
              @click="startTest('maaltafel')"
              icon="flash_on"
            >
              {{ t('start_test') }}
            </q-btn>
          </q-card>

          <!-- Recent Scores -->
          <q-card flat class="bee-card q-pa-md q-mb-md" v-if="recentAttempts.length > 0">
            <div class="row items-center q-mb-sm">
              <q-icon name="history" class="q-mr-xs" />
              <span class="text-weight-bold">{{ lang === 'af' ? 'Onlangse Toetse' : 'Recent Tests' }}</span>
              <q-space />
              <q-btn
                flat dense size="sm" no-caps
                color="red-6"
                icon="delete_sweep"
                :label="lang === 'af' ? 'Verwyder' : 'Clear'"
                @click="confirmClearHistory"
              />
            </div>
            <q-list dense separator>
              <q-item v-for="a in recentAttempts" :key="a.id">
                <q-item-section>
                  <q-item-label>{{ a.template_name }}</q-item-label>
                  <q-item-label caption>{{ formatDate(a.date) }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge :color="a.percentage >= 80 ? 'positive' : a.percentage >= 50 ? 'warning' : 'grey'">
                    {{ a.score }}/{{ a.total }} ({{ a.percentage }}%)
                  </q-badge>
                </q-item-section>
              </q-item>
            </q-list>
            <div class="row q-mt-sm q-gutter-sm">
              <q-btn flat dense no-caps color="amber-8" :label="t('history')" to="/math/history" icon="bar_chart" />
              <q-btn flat dense no-caps color="amber-8" :label="t('leaderboard')" to="/math/leaderboard" icon="leaderboard" />
            </div>
          </q-card>

          <div v-if="recentAttempts.length === 0" class="text-center q-mt-md">
            <q-btn flat no-caps color="amber-8" :label="t('leaderboard')" to="/math/leaderboard" icon="leaderboard" />
          </div>
        </q-tab-panel>

        <!-- Tab: Plus Minus -->
        <q-tab-panel name="plusminus" class="q-pa-none">
          <q-card flat class="bee-card q-pa-md q-mb-md" v-if="!store.playerName">
            <q-input
              v-model="nameInput"
              outlined
              :label="t('player_name')"
              @keydown.enter="saveName"
              class="q-mb-sm"
            >
              <template #prepend><q-icon name="person" /></template>
            </q-input>
            <q-btn class="btn-bee full-width" no-caps @click="saveName" :disable="!nameInput.trim()">
              {{ lang === 'af' ? 'Stoor' : 'Save' }}
            </q-btn>
          </q-card>

          <q-card flat class="bee-card q-pa-md q-mb-md" v-if="store.playerName">
            <div class="row items-center q-mb-sm">
              <q-icon name="person" color="amber-8" size="20px" class="q-mr-sm" />
              <span class="text-weight-bold">{{ store.playerName }}</span>
            </div>

            <q-select
              v-model="selectedGrade"
              outlined
              :label="t('grade')"
              :options="gradeOptions"
              emit-value
              map-options
              class="q-mb-md"
            />

            <div class="text-caption text-grey-6 q-mb-sm text-center">
              50 {{ lang === 'af' ? 'vrae' : 'questions' }} &bull; 6 {{ t('minutes') }} &bull; + {{ lang === 'af' ? 'en' : 'and' }} &minus;
            </div>

            <q-btn
              class="btn-bee full-width"
              size="lg"
              no-caps
              :loading="generating"
              @click="startTest('plusminus')"
              icon="flash_on"
            >
              {{ t('start_test') }}
            </q-btn>
          </q-card>
        </q-tab-panel>

        <!-- Tab: Probleemoplossing -->
        <q-tab-panel name="probleemoplossing" class="q-pa-none">
          <q-card flat class="bee-card q-pa-md q-mb-md" v-if="!store.playerName">
            <q-input
              v-model="nameInput"
              outlined
              :label="t('player_name')"
              @keydown.enter="saveName"
              class="q-mb-sm"
            >
              <template #prepend><q-icon name="person" /></template>
            </q-input>
            <q-btn class="btn-bee full-width" no-caps @click="saveName" :disable="!nameInput.trim()">
              {{ lang === 'af' ? 'Stoor' : 'Save' }}
            </q-btn>
          </q-card>

          <q-card flat class="bee-card q-pa-md q-mb-md" v-if="store.playerName">
            <div class="row items-center q-mb-sm">
              <q-icon name="person" color="amber-8" size="20px" class="q-mr-sm" />
              <span class="text-weight-bold">{{ store.playerName }}</span>
            </div>

            <q-select
              v-model="selectedGrade"
              outlined
              :label="t('grade')"
              :options="gradeOptions"
              emit-value
              map-options
              class="q-mb-md"
            />

            <div class="text-caption text-grey-6 q-mb-xs text-center">
              20 {{ lang === 'af' ? 'vrae' : 'questions' }} &bull; 60 {{ t('minutes') }} &bull;
              {{ lang === 'af' ? 'Meervoudige keuse' : 'Multiple choice' }} (A-E)
            </div>
            <div class="text-caption text-grey-5 q-mb-sm text-center">
              <q-icon name="calculate" size="14px" class="q-mr-xs" />
              {{ lang === 'af' ? 'Sakrekenaar toegelaat' : 'Calculator allowed' }}
            </div>

            <q-btn
              class="btn-bee full-width"
              size="lg"
              no-caps
              :loading="generatingProblems"
              @click="startProblemTest"
              icon="psychology"
            >
              {{ t('start_test') }}
            </q-btn>

            <div v-if="generatingProblems" class="text-caption text-grey-5 text-center q-mt-sm">
              {{ lang === 'af' ? 'KI genereer vrae... dit kan 30 sekondes neem' : 'AI generating questions... this may take 30 seconds' }}
            </div>
          </q-card>

          <q-card flat class="bee-card q-pa-md">
            <div class="text-caption text-grey-6">
              <q-icon name="info" size="14px" class="q-mr-xs" />
              {{ lang === 'af'
                ? 'Hierdie vrae is soortgelyk aan die SA Wiskunde-uitdaging. Elke toets is uniek — gegenereer deur KI.'
                : 'These questions are similar to the SA Mathematics Challenge. Every test is unique — generated by AI.'
              }}
            </div>
          </q-card>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'src/i18n'
import { useMathTest } from 'src/composables/useMathTest'
import { useMathTestStore } from 'src/stores/math-test'
import { Notify, Dialog } from 'quasar'

const { t, lang, toggleLanguage } = useI18n()
const { generateTest, generateProblems, getHistory, deleteHistory } = useMathTest()
const store = useMathTestStore()
const router = useRouter()

const activeTab = ref('maaltafel')
const nameInput = ref(store.playerName)
const editName = ref(false)
const selectedGrade = ref(4)
const generating = ref(false)
const generatingProblems = ref(false)
const recentAttempts = ref<any[]>([])

const gradeOptions = [
  { label: 'Gr 1', value: 1 },
  { label: 'Gr 2', value: 2 },
  { label: 'Gr 3', value: 3 },
  { label: 'Gr 4', value: 4 },
  { label: 'Gr 5', value: 5 },
  { label: 'Gr 6', value: 6 },
  { label: 'Gr 7', value: 7 },
]

function saveName() {
  if (nameInput.value.trim()) {
    store.setPlayerName(nameInput.value.trim())
    editName.value = false
  }
}

async function startTest(mode: 'maaltafel' | 'plusminus') {
  if (!store.playerName) return
  generating.value = true
  try {
    const config: any = {
      grade: selectedGrade.value,
      language: lang.value,
    }
    if (mode === 'plusminus') {
      config.operations = ['add', 'subtract']
    }
    const template = await generateTest(config)
    router.push({ name: 'math-test', params: { templateId: template.id } })
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err.response?.data?.message || 'Failed to generate test' })
  } finally {
    generating.value = false
  }
}

async function startProblemTest() {
  if (!store.playerName) return
  generatingProblems.value = true
  try {
    const template = await generateProblems({
      grade: selectedGrade.value,
      language: lang.value,
    })
    router.push({ name: 'math-problems', params: { templateId: template.id } })
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err.response?.data?.message || 'Failed to generate problems' })
  } finally {
    generatingProblems.value = false
  }
}

function confirmClearHistory() {
  Dialog.create({
    title: lang.value === 'af' ? 'Verwyder toetse?' : 'Clear tests?',
    message: lang.value === 'af'
      ? 'Dit sal jou naam en alle toetsresultate verwyder. Is jy seker?'
      : 'This will remove your name and all test results. Are you sure?',
    cancel: { label: lang.value === 'af' ? 'Nee' : 'No', flat: true },
    ok: { label: lang.value === 'af' ? 'Ja, verwyder' : 'Yes, clear', color: 'negative' },
  }).onOk(async () => {
    try {
      await deleteHistory(store.playerName)
    } catch {
      // Server delete failed — still clear locally
    }
    localStorage.removeItem('bg_math_player')
    localStorage.removeItem('bg_math_lang')
    store.playerName = ''
    recentAttempts.value = []
    Notify.create({
      type: 'positive',
      message: lang.value === 'af' ? 'Toetse verwyder!' : 'Tests cleared!',
    })
  })
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(lang.value === 'af' ? 'af-ZA' : 'en-ZA', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

onMounted(async () => {
  if (store.playerName) {
    nameInput.value = store.playerName
    try {
      const data = await getHistory(store.playerName)
      recentAttempts.value = data.attempts.slice(0, 3)
    } catch {
      // Silently fail
    }
  }
})
</script>
