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
          {{ lang === 'af' ? 'Skakel nie gevind nie' : (lang === 'tn' ? 'Linki ga e a bonwe' : 'Link not found') }}
        </div>
        <div class="text-caption text-grey-5 q-mt-sm">
          {{ lang === 'af' ? 'Vra jou ouer om die skakel weer te stuur.' : 'Ask your parent to send the link again.' }}
        </div>
      </div>

      <!-- Child Profile Loaded -->
      <template v-else-if="child">
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

        <!-- Phase 1: Subject Selection (big buttons) -->
        <template v-if="!selectedSubject">
          <div class="text-center q-mb-md">
            <div class="text-h5 text-weight-bold" style="color: #78350f;">
              {{ lang === 'af' ? 'Kies \'n Vak' : (lang === 'tn' ? 'Tlhopha Thuto' : 'Choose a Subject') }}
            </div>
          </div>

          <!-- Maths (always available) -->
          <q-card
            flat class="bee-card q-pa-lg q-mb-md cursor-pointer subject-btn"
            style="border-left: 6px solid #f59e0b;"
            @click="selectedSubject = 'maths'"
          >
            <div class="row items-center">
              <q-icon name="calculate" size="48px" color="amber-8" class="q-mr-md" />
              <div>
                <div class="text-h6 text-weight-bold" style="color: #78350f;">
                  {{ lang === 'af' ? 'Wiskunde' : (lang === 'tn' ? 'Mmetse' : 'Mathematics') }}
                </div>
                <div class="text-caption text-grey-6">
                  {{ lang === 'af' ? 'Maaltafel, Plus Minus, Probleemoplossing' : 'Times Tables, Plus Minus, Problem Solving' }}
                </div>
              </div>
              <q-space />
              <q-icon name="chevron_right" color="amber-8" size="28px" />
            </div>
          </q-card>

          <!-- Natural Science (Grade 4-6) -->
          <q-card
            v-if="hasSubject('natural_science')"
            flat class="bee-card q-pa-lg q-mb-md cursor-pointer subject-btn"
            style="border-left: 6px solid #16a34a;"
            @click="selectedSubject = 'natural_science'"
          >
            <div class="row items-center">
              <q-icon name="science" size="48px" color="green" class="q-mr-md" />
              <div>
                <div class="text-h6 text-weight-bold" style="color: #166534;">
                  {{ lang === 'af' ? 'Natuurwetenskap' : (lang === 'tn' ? 'Saense ya Tlhago' : 'Natural Science') }}
                </div>
                <div class="text-caption text-grey-6">
                  {{ lang === 'af' ? '40 vrae, Meervoudige keuse (A-D)' : '40 questions, Multiple choice (A-D)' }}
                </div>
              </div>
              <q-space />
              <q-icon name="chevron_right" color="green" size="28px" />
            </div>
          </q-card>

          <!-- Life Skills (Grade 1-3) -->
          <q-card
            v-if="hasSubject('life_skills')"
            flat class="bee-card q-pa-lg q-mb-md cursor-pointer subject-btn"
            style="border-left: 6px solid #2563eb;"
            @click="selectedSubject = 'life_skills'"
          >
            <div class="row items-center">
              <q-icon name="emoji_nature" size="48px" color="blue" class="q-mr-md" />
              <div>
                <div class="text-h6 text-weight-bold" style="color: #1e3a5f;">
                  {{ lang === 'af' ? 'Lewensvaardighede' : (lang === 'tn' ? 'Bokgoni jwa Botshelo' : 'Life Skills') }}
                </div>
                <div class="text-caption text-grey-6">
                  {{ lang === 'af' ? '20 vrae, Meervoudige keuse (A-D)' : '20 questions, Multiple choice (A-D)' }}
                </div>
              </div>
              <q-space />
              <q-icon name="chevron_right" color="blue" size="28px" />
            </div>
          </q-card>
          <!-- Languages (grouped) -->
          <q-card
            v-if="hasSubject('english') || hasSubject('afrikaans') || hasSubject('setswana')"
            flat class="bee-card q-pa-lg q-mb-md cursor-pointer subject-btn"
            style="border-left: 6px solid #7c3aed;"
            @click="selectedSubject = 'languages'"
          >
            <div class="row items-center">
              <q-icon name="translate" size="48px" color="purple" class="q-mr-md" />
              <div>
                <div class="text-h6 text-weight-bold" style="color: #5b21b6;">
                  {{ lang === 'af' ? 'Tale' : (lang === 'tn' ? 'Dipuo' : 'Languages') }}
                </div>
                <div class="text-caption text-grey-6">
                  {{ availableLanguageNames }}
                </div>
              </div>
              <q-space />
              <q-icon name="chevron_right" color="purple" size="28px" />
            </div>
          </q-card>

        </template>

        <!-- Phase 2: Test types for selected subject -->
        <template v-if="selectedSubject">
          <!-- Back button -->
          <q-btn flat dense no-caps icon="arrow_back" :label="lang === 'af' ? 'Terug' : 'Back'" color="grey-7" class="q-mb-sm" @click="selectedSubject = ''; subTab = 'test'" />

          <!-- Test / Scores toggle (hidden on language picker) -->
          <q-btn-toggle
            v-if="selectedSubject !== 'languages'"
            v-model="subTab"
            no-caps dense rounded spread
            toggle-color="amber-8"
            color="grey-3"
            text-color="grey-7"
            :options="[
              { label: lang === 'af' ? 'Toets' : 'Test', value: 'test', icon: 'play_arrow' },
              { label: lang === 'af' ? 'Punte' : 'Scores', value: 'scores', icon: 'emoji_events' },
            ]"
            class="q-mb-md"
            @update:model-value="loadScores"
          />

          <!-- LANGUAGES — pick which language -->
          <template v-if="selectedSubject === 'languages'">
            <div class="text-center q-mb-md">
              <q-icon name="translate" size="36px" color="purple" />
              <div class="text-h5 text-weight-bold" style="color: #5b21b6;">
                {{ lang === 'af' ? 'Kies \'n Taal' : 'Choose a Language' }}
              </div>
            </div>

            <q-card
              v-if="hasSubject('english')"
              flat class="bee-card q-pa-md q-mb-sm cursor-pointer subject-btn"
              style="border-left: 4px solid #7c3aed;"
              @click="selectedSubject = 'english'; subTab = 'test'"
            >
              <div class="row items-center">
                <q-icon name="menu_book" size="32px" color="purple" class="q-mr-sm" />
                <div>
                  <div class="text-weight-bold" style="color: #5b21b6;">English</div>
                  <div class="text-caption text-grey-6">Spelling, Vocabulary, Grammar</div>
                </div>
                <q-space />
                <q-icon name="chevron_right" color="grey-5" />
              </div>
            </q-card>

            <q-card
              v-if="hasSubject('afrikaans')"
              flat class="bee-card q-pa-md q-mb-sm cursor-pointer subject-btn"
              style="border-left: 4px solid #ea580c;"
              @click="selectedSubject = 'afrikaans'; subTab = 'test'"
            >
              <div class="row items-center">
                <q-icon name="auto_stories" size="32px" color="orange-8" class="q-mr-sm" />
                <div>
                  <div class="text-weight-bold" style="color: #9a3412;">Afrikaans</div>
                  <div class="text-caption text-grey-6">Spelling, Woordeskat, Taal</div>
                </div>
                <q-space />
                <q-icon name="chevron_right" color="grey-5" />
              </div>
            </q-card>

            <q-card
              v-if="hasSubject('setswana')"
              flat class="bee-card q-pa-md q-mb-sm cursor-pointer subject-btn"
              style="border-left: 4px solid #0891b2;"
              @click="selectedSubject = 'setswana'; subTab = 'test'"
            >
              <div class="row items-center">
                <q-icon name="record_voice_over" size="32px" color="cyan-8" class="q-mr-sm" />
                <div>
                  <div class="text-weight-bold" style="color: #155e75;">Setswana</div>
                  <div class="text-caption text-grey-6">Mopeleto, Tlotlofoko, Popego</div>
                </div>
                <q-space />
                <q-icon name="chevron_right" color="grey-5" />
              </div>
            </q-card>
          </template>

          <!-- === SCORES TAB === -->
          <template v-if="subTab === 'scores'">
            <div v-if="loadingScores" class="text-center q-pa-lg">
              <q-spinner-gears color="amber" size="32px" />
            </div>
            <template v-else-if="subjectScores">
              <!-- Stats -->
              <div class="row q-gutter-sm q-mb-md">
                <q-card flat class="bee-card q-pa-sm col text-center">
                  <div class="text-h5 text-weight-bold" style="color: #78350f;">{{ subjectScores.stats.total_tests }}</div>
                  <div class="text-caption text-grey-6">{{ lang === 'af' ? 'Toetse' : 'Tests' }}</div>
                </q-card>
                <q-card flat class="bee-card q-pa-sm col text-center">
                  <div class="text-h5 text-weight-bold" style="color: #f59e0b;">{{ subjectScores.stats.average_score }}%</div>
                  <div class="text-caption text-grey-6">{{ lang === 'af' ? 'Gemiddeld' : 'Average' }}</div>
                </q-card>
                <q-card flat class="bee-card q-pa-sm col text-center">
                  <div class="text-h5 text-weight-bold" style="color: #16a34a;">{{ subjectScores.stats.best_score }}%</div>
                  <div class="text-caption text-grey-6">{{ lang === 'af' ? 'Beste' : 'Best' }}</div>
                </q-card>
              </div>

              <!-- Attempts list -->
              <q-card flat class="bee-card q-pa-md">
                <div v-if="subjectScores.attempts.length === 0" class="text-center text-grey-5 q-pa-md">
                  {{ lang === 'af' ? 'Nog geen toetse nie' : 'No tests yet' }}
                </div>
                <q-list v-else separator>
                  <q-item
                    v-for="a in subjectScores.attempts"
                    :key="a.id"
                    clickable
                    @click="viewAttempt(a)"
                  >
                    <q-item-section avatar>
                      <q-icon
                        :name="a.percentage >= 80 ? 'star' : a.percentage >= 50 ? 'thumb_up' : 'fitness_center'"
                        :color="a.percentage >= 80 ? 'amber' : a.percentage >= 50 ? 'green' : 'grey'"
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ a.template_name }}</q-item-label>
                      <q-item-label caption>
                        {{ formatDate(a.date) }} &bull;
                        {{ Math.floor(a.time_used_sec / 60) }}m {{ a.time_used_sec % 60 }}s
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <div class="text-weight-bold" :style="{ color: a.percentage >= 80 ? '#16a34a' : a.percentage >= 50 ? '#f59e0b' : '#ef4444' }">
                        {{ a.score }}/{{ a.total }} ({{ a.percentage }}%)
                      </div>
                    </q-item-section>
                    <q-item-section side>
                      <q-icon name="chevron_right" color="grey-5" />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card>
            </template>
          </template>

          <!-- === TEST TAB === -->
          <!-- MATHS test types -->
          <template v-if="subTab === 'test' && selectedSubject === 'maths'">
            <div class="text-center q-mb-md">
              <q-icon name="calculate" size="36px" color="amber-8" />
              <div class="text-h5 text-weight-bold" style="color: #78350f;">
                {{ lang === 'af' ? 'Wiskunde' : 'Mathematics' }}
              </div>
            </div>

            <!-- Maaltafel -->
            <q-card flat class="bee-card q-pa-md q-mb-md">
              <div class="text-weight-bold q-mb-xs" style="color: #78350f;">
                {{ lang === 'af' ? 'Maaltafel' : (lang === 'tn' ? 'Tafole' : 'Times Tables') }}
              </div>
              <div class="text-caption text-grey-6 q-mb-sm">
                50 {{ lang === 'af' ? 'vrae' : 'questions' }} &bull; 6 {{ lang === 'af' ? 'minute' : 'minutes' }} &bull; &times; &divide;
              </div>
              <q-btn class="btn-bee full-width" no-caps :loading="generating" @click="startSpeedTest('maaltafel')" icon="flash_on">
                {{ lang === 'af' ? 'Begin Toets' : 'Start Test' }}
              </q-btn>
            </q-card>

            <!-- Plus Minus -->
            <q-card flat class="bee-card q-pa-md q-mb-md">
              <div class="text-weight-bold q-mb-xs" style="color: #78350f;">
                {{ lang === 'af' ? 'Plus Minus' : 'Plus Minus' }}
              </div>
              <div class="text-caption text-grey-6 q-mb-sm">
                50 {{ lang === 'af' ? 'vrae' : 'questions' }} &bull; 6 {{ lang === 'af' ? 'minute' : 'minutes' }} &bull; + &minus;
              </div>
              <q-btn class="btn-bee full-width" no-caps :loading="generating" @click="startSpeedTest('plusminus')" icon="flash_on">
                {{ lang === 'af' ? 'Begin Toets' : 'Start Test' }}
              </q-btn>
            </q-card>

            <!-- Probleemoplossing -->
            <q-card flat class="bee-card q-pa-md q-mb-md">
              <div class="text-weight-bold q-mb-xs" style="color: #78350f;">
                {{ lang === 'af' ? 'Probleemoplossing' : 'Problem Solving' }}
              </div>
              <div class="text-caption text-grey-6 q-mb-sm">
                20 {{ lang === 'af' ? 'vrae' : 'questions' }} &bull; 60 {{ lang === 'af' ? 'minute' : 'minutes' }} &bull;
                {{ lang === 'af' ? 'Meervoudige keuse (A-E)' : 'Multiple choice (A-E)' }}
              </div>
              <q-btn class="btn-bee full-width" no-caps :loading="generatingAI" @click="startProblemTest" icon="psychology">
                {{ lang === 'af' ? 'Begin Toets' : 'Start Test' }}
              </q-btn>
              <div v-if="generatingAI" class="text-caption text-grey-5 text-center q-mt-sm">
                {{ lang === 'af' ? 'KI genereer vrae... dit kan 30s neem' : 'AI generating questions... may take 30s' }}
              </div>
            </q-card>
          </template>

          <!-- NATURAL SCIENCE -->
          <template v-if="subTab === 'test' && selectedSubject === 'natural_science'">
            <div class="text-center q-mb-md">
              <q-icon name="science" size="36px" color="green" />
              <div class="text-h5 text-weight-bold" style="color: #166534;">
                {{ lang === 'af' ? 'Natuurwetenskap' : 'Natural Science' }}
              </div>
            </div>

            <q-card flat class="bee-card q-pa-md q-mb-md">
              <div class="text-caption text-grey-6 q-mb-sm text-center">
                40 {{ lang === 'af' ? 'vrae' : 'questions' }} &bull; 60 {{ lang === 'af' ? 'minute' : 'minutes' }} &bull;
                {{ lang === 'af' ? 'Meervoudige keuse (A-D)' : 'Multiple choice (A-D)' }}
              </div>
              <q-btn color="green" class="full-width" size="lg" no-caps :loading="generatingAI" @click="startSubjectTest('natural_science')" icon="science">
                {{ lang === 'af' ? 'Begin Toets' : 'Start Test' }}
              </q-btn>
              <div v-if="generatingAI" class="text-caption text-grey-5 text-center q-mt-sm">
                {{ lang === 'af' ? 'KI genereer vrae... dit kan 30s neem' : 'AI generating questions... may take 30s' }}
              </div>
            </q-card>
          </template>

          <!-- LIFE SKILLS -->
          <template v-if="subTab === 'test' && selectedSubject === 'life_skills'">
            <div class="text-center q-mb-md">
              <q-icon name="emoji_nature" size="36px" color="blue" />
              <div class="text-h5 text-weight-bold" style="color: #1e3a5f;">
                {{ lang === 'af' ? 'Lewensvaardighede' : 'Life Skills' }}
              </div>
            </div>

            <q-card flat class="bee-card q-pa-md q-mb-md">
              <div class="text-caption text-grey-6 q-mb-sm text-center">
                20 {{ lang === 'af' ? 'vrae' : 'questions' }} &bull; 30 {{ lang === 'af' ? 'minute' : 'minutes' }} &bull;
                {{ lang === 'af' ? 'Meervoudige keuse (A-D)' : 'Multiple choice (A-D)' }}
              </div>
              <q-btn color="blue" class="full-width" size="lg" no-caps :loading="generatingAI" @click="startSubjectTest('life_skills')" icon="emoji_nature">
                {{ lang === 'af' ? 'Begin Toets' : 'Start Test' }}
              </q-btn>
              <div v-if="generatingAI" class="text-caption text-grey-5 text-center q-mt-sm">
                {{ lang === 'af' ? 'KI genereer vrae... dit kan 30s neem' : 'AI generating questions... may take 30s' }}
              </div>
            </q-card>
          </template>

          <!-- ENGLISH -->
          <template v-if="subTab === 'test' && selectedSubject === 'english'">
            <div class="text-center q-mb-md">
              <q-icon name="menu_book" size="36px" color="purple" />
              <div class="text-h5 text-weight-bold" style="color: #5b21b6;">English</div>
            </div>
            <q-card flat class="bee-card q-pa-md q-mb-md">
              <div class="text-caption text-grey-6 q-mb-sm text-center">
                {{ lang === 'af' ? 'Spelling, Woordeskat, Grammatika' : 'Spelling, Vocabulary, Grammar' }} &bull;
                30 {{ lang === 'af' ? 'minute' : 'minutes' }}
              </div>
              <q-btn color="purple" class="full-width" size="lg" no-caps :loading="generatingAI" @click="startSubjectTest('english')" icon="menu_book">
                {{ lang === 'af' ? 'Begin Toets' : 'Start Test' }}
              </q-btn>
              <div v-if="generatingAI" class="text-caption text-grey-5 text-center q-mt-sm">
                {{ lang === 'af' ? 'KI genereer vrae...' : 'AI generating questions...' }}
              </div>
            </q-card>
          </template>

          <!-- AFRIKAANS -->
          <template v-if="subTab === 'test' && selectedSubject === 'afrikaans'">
            <div class="text-center q-mb-md">
              <q-icon name="auto_stories" size="36px" color="orange-8" />
              <div class="text-h5 text-weight-bold" style="color: #9a3412;">Afrikaans</div>
            </div>
            <q-card flat class="bee-card q-pa-md q-mb-md">
              <div class="text-caption text-grey-6 q-mb-sm text-center">
                Spelling, Woordeskat, Taal &bull; 30 {{ lang === 'af' ? 'minute' : 'minutes' }}
              </div>
              <q-btn color="orange-8" class="full-width" size="lg" no-caps :loading="generatingAI" @click="startSubjectTest('afrikaans')" icon="auto_stories">
                {{ lang === 'af' ? 'Begin Toets' : 'Start Test' }}
              </q-btn>
              <div v-if="generatingAI" class="text-caption text-grey-5 text-center q-mt-sm">
                {{ lang === 'af' ? 'KI genereer vrae...' : 'AI generating questions...' }}
              </div>
            </q-card>
          </template>

          <!-- SETSWANA -->
          <template v-if="subTab === 'test' && selectedSubject === 'setswana'">
            <div class="text-center q-mb-md">
              <q-icon name="translate" size="36px" color="cyan-8" />
              <div class="text-h5 text-weight-bold" style="color: #155e75;">Setswana</div>
            </div>
            <q-card flat class="bee-card q-pa-md q-mb-md">
              <div class="text-caption text-grey-6 q-mb-sm text-center">
                {{ lang === 'tn' ? 'Mopeleto, Tlotlofoko, Popego' : 'Spelling, Vocabulary, Language' }} &bull; 30 {{ lang === 'af' ? 'minute' : 'minutes' }}
              </div>
              <q-btn color="cyan-8" class="full-width" size="lg" no-caps :loading="generatingAI" @click="startSubjectTest('setswana')" icon="translate">
                {{ lang === 'af' ? 'Begin Toets' : 'Start Test' }}
              </q-btn>
              <div v-if="generatingAI" class="text-caption text-grey-5 text-center q-mt-sm">
                {{ lang === 'af' ? 'KI genereer vrae...' : 'AI generating questions...' }}
              </div>
            </q-card>
          </template>

        </template>

        <!-- Recent Scores -->
        <q-card v-if="child.recent_attempts && child.recent_attempts.length > 0 && !selectedSubject" flat class="bee-card q-pa-md q-mb-md">
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
import { backendApi } from 'src/boot/axios'
import { Notify } from 'quasar'

const { lang, setLanguage } = useI18n()
const { getChildBySlug } = useChildren()
const { generateTest, generateProblems } = useMathTest()
const store = useMathTestStore()
const route = useRoute()
const router = useRouter()

const child = ref<any>(null)
const loading = ref(true)
const error = ref(false)
const selectedSubject = ref('')
const subTab = ref('test')
const generating = ref(false)
const generatingAI = ref(false)

// Scores
const loadingScores = ref(false)
const subjectScores = ref<any>(null)

const availableLanguageNames = computed(() => {
  const langs = []
  if (hasSubject('english')) langs.push('English')
  if (hasSubject('afrikaans')) langs.push('Afrikaans')
  if (hasSubject('setswana')) langs.push('Setswana')
  return langs.join(', ')
})

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(lang.value === 'af' ? 'af-ZA' : 'en-ZA', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

async function loadScores() {
  if (subTab.value !== 'scores' || !child.value || !selectedSubject.value) return
  loadingScores.value = true
  subjectScores.value = null
  try {
    const { data } = await backendApi.get(`/children/${child.value.id}/scores/${selectedSubject.value}`)
    subjectScores.value = data
  } catch {
    subjectScores.value = { stats: { total_tests: 0, average_score: 0, best_score: 0 }, attempts: [] }
  } finally {
    loadingScores.value = false
  }
}

function viewAttempt(attempt: any) {
  // Navigate to the result page to review wrong answers
  router.push({
    name: 'math-result',
    params: { attemptId: attempt.id },
    query: { templateId: attempt.template_id, returnTo: route.fullPath },
  })
}

function hasSubject(code: string): boolean {
  if (!child.value?.subjects) return false
  return child.value.subjects.some((s: any) => s.code === code)
}

async function startSpeedTest(mode: 'maaltafel' | 'plusminus') {
  generating.value = true
  try {
    const config: any = { grade: child.value.grade, language: lang.value }
    if (mode === 'plusminus') config.operations = ['add', 'subtract']
    const template = await generateTest(config)
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
  generatingAI.value = true
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
    generatingAI.value = false
  }
}

async function startSubjectTest(subjectCode: string) {
  generatingAI.value = true
  try {
    const { data } = await backendApi.post('/subject-tests/generate', {
      subject_code: subjectCode,
      grade: child.value.grade,
      language: lang.value,
    })
    store.setPlayerName(child.value.name)
    router.push({
      name: 'math-problems',
      params: { templateId: data.id },
      query: { childId: child.value.id, returnTo: route.fullPath, subject: subjectCode },
    })
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err.response?.data?.message || 'Failed to generate test' })
  } finally {
    generatingAI.value = false
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

<style scoped>
.subject-btn {
  transition: transform 0.15s, box-shadow 0.15s;
}
.subject-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}
</style>
