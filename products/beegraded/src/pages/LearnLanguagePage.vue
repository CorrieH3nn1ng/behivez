<template>
  <q-page class="honeycomb-bg">
    <div class="page-container" style="max-width: 600px;">
      <q-btn flat dense no-caps icon="arrow_back" label="Back" color="amber-8" class="q-mb-md" to="/workspace/account" />

      <div class="text-center q-mb-md">
        <q-icon name="school" size="48px" color="amber" />
        <h2 class="text-h5 text-weight-bold q-mb-none" style="color: #78350f;">
          Learn {{ targetLangName }}
        </h2>
        <div class="text-caption text-grey-6">{{ levelLabel }}</div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner-gears color="amber" size="48px" />
        <div class="q-mt-md text-grey-6">Generating your lesson...</div>
      </div>

      <!-- Error -->
      <q-banner v-if="error" class="bg-red-1 text-red-8 q-mb-md" rounded>
        <template v-slot:avatar><q-icon name="error" color="red" /></template>
        {{ error }}
        <template v-slot:action>
          <q-btn flat label="Try Again" color="red" @click="generateLesson" />
        </template>
      </q-banner>

      <!-- Phase 1: Flashcards -->
      <template v-if="!loading && !error && words.length > 0 && phase === 'learn'">
        <div class="text-center q-mb-sm">
          <q-badge color="amber" class="q-pa-xs">
            {{ currentIndex + 1 }} / {{ words.length }}
          </q-badge>
        </div>

        <!-- Flashcard -->
        <q-card
          flat
          class="bee-card q-pa-xl q-mb-md text-center cursor-pointer"
          style="min-height: 250px; display: flex; flex-direction: column; justify-content: center;"
          @click="flipped = !flipped"
        >
          <template v-if="!flipped">
            <div class="text-h3 text-weight-bold" style="color: #78350f;">
              {{ currentWord.word }}
            </div>
            <div class="text-body1 text-grey-6 q-mt-sm">
              {{ currentWord.pronunciation }}
            </div>
            <div v-if="currentWord.pronunciation_native && homeLangName" class="text-caption text-blue-6 q-mt-xs">
              {{ homeLangName }}: {{ currentWord.pronunciation_native }}
            </div>
            <q-btn flat round icon="volume_up" color="amber-8" size="lg" class="q-mt-sm" @click.stop="speakPronunciation(currentWord.word, currentWord.pronunciation)" />
            <div class="text-caption text-grey-4 q-mt-sm">tap card to reveal meaning</div>
          </template>
          <template v-else>
            <div class="text-h4 text-weight-bold text-amber-8">
              {{ homeTranslation(currentWord) }}
            </div>
            <div class="q-mt-md q-pa-sm" style="background: #fef9ee; border-radius: 8px;">
              <div style="font-size: 15px; color: #555;">
                <q-btn flat dense round icon="volume_up" size="sm" color="amber-8" class="q-mr-xs" @click.stop="speakPronunciation(currentWord.word, currentWord.pronunciation)" />
                <b>{{ currentWord.word }}</b> — {{ currentWord.pronunciation }}
                <span v-if="currentWord.pronunciation_native && homeLangName" class="text-caption text-blue-6 q-ml-sm">({{ currentWord.pronunciation_native }})</span>
              </div>
              <div class="q-mt-sm" style="font-size: 14px; color: #666;">
                "{{ currentWord.example }}"
              </div>
              <div class="text-caption text-grey-6 q-mt-xs">
                {{ homeExample(currentWord) }}
              </div>
            </div>
            <q-badge :color="categoryColor(currentWord.category)" class="q-mt-md q-pa-xs">
              {{ currentWord.category }}
            </q-badge>
          </template>
        </q-card>

        <!-- Navigation -->
        <div class="row q-gutter-sm justify-center">
          <q-btn outline color="grey" icon="arrow_back" :disable="currentIndex === 0" @click="prevCard" no-caps label="Previous" />
          <q-btn v-if="currentIndex < words.length - 1" class="btn-bee" icon-right="arrow_forward" @click="nextCard" no-caps label="Next" />
          <q-btn v-else class="btn-bee" icon="quiz" @click="startQuiz" no-caps label="Take Quiz" />
        </div>

        <!-- Progress dots -->
        <div class="text-center q-mt-md">
          <span
            v-for="(w, i) in words"
            :key="i"
            class="q-mx-xs"
            :style="{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: i === currentIndex ? '#f59e0b' : i < currentIndex ? '#16a34a' : '#d1d5db',
            }"
          />
        </div>
      </template>

      <!-- Phase 2: Quiz -->
      <template v-if="phase === 'quiz'">
        <div class="text-center q-mb-md">
          <q-badge color="green">
            Question {{ quizIndex + 1 }} / {{ words.length }}
          </q-badge>
        </div>

        <q-card flat class="bee-card q-pa-lg q-mb-md">
          <div class="text-center q-mb-lg">
            <div class="text-h5 text-weight-bold" style="color: #78350f;">
              {{ homeTranslation(quizWord) }}
            </div>
            <div class="text-caption text-grey-5 q-mt-xs">What is this in {{ targetLangName }}?</div>
          </div>

          <div class="column q-gutter-sm">
            <q-btn
              v-for="(opt, i) in quizOptions"
              :key="i"
              no-caps
              :outline="quizAnswer !== i"
              :color="quizAnswered ? (opt === quizWord.word ? 'positive' : quizAnswer === i ? 'negative' : 'grey') : 'amber-8'"
              class="full-width"
              style="font-size: 16px; padding: 12px;"
              :disable="quizAnswered"
              @click="answerQuiz(i)"
            >
              {{ opt }}
            </q-btn>
          </div>

          <div v-if="quizAnswered" class="text-center q-mt-md">
            <div v-if="quizCorrect" class="text-positive text-weight-bold">
              <q-icon name="check_circle" /> Correct!
            </div>
            <div v-else class="text-negative">
              <q-icon name="cancel" /> The answer is: <b>{{ quizWord.word }}</b>
            </div>
            <div class="text-caption text-grey-6 q-mt-xs">
              {{ quizWord.pronunciation }} — "{{ quizWord.example }}"
            </div>
            <q-btn
              class="btn-bee q-mt-md"
              no-caps
              :label="quizIndex < words.length - 1 ? 'Next' : 'See Results'"
              @click="nextQuizQuestion"
            />
          </div>
        </q-card>
      </template>

      <!-- Phase 3: Results -->
      <template v-if="phase === 'results'">
        <q-card flat class="bee-card q-pa-xl q-mb-md text-center">
          <q-icon :name="quizScore >= 7 ? 'emoji_events' : quizScore >= 5 ? 'thumb_up' : 'fitness_center'" size="64px" :color="quizScore >= 7 ? 'amber' : quizScore >= 5 ? 'green' : 'grey'" />
          <div class="text-h4 text-weight-bold q-mt-md" style="color: #78350f;">
            {{ quizScore }} / {{ words.length }}
          </div>
          <div class="text-subtitle1 text-grey-7 q-mt-sm">
            {{ quizScore >= 8 ? 'Excellent! You\'re a natural!' : quizScore >= 5 ? 'Good effort! Keep practicing!' : 'Keep going! Practice makes perfect!' }}
          </div>
        </q-card>

        <div class="row q-gutter-sm justify-center">
          <q-btn outline color="amber-8" icon="replay" label="Study Again" no-caps @click="resetLearn" />
          <q-btn class="btn-bee" icon="refresh" label="New Lesson" no-caps @click="generateLesson" />
        </div>

        <!-- Word review -->
        <q-card flat class="bee-card q-pa-md q-mt-md">
          <div class="text-weight-bold q-mb-sm">Words from this lesson:</div>
          <q-list dense separator>
            <q-item v-for="w in words" :key="w.word">
              <q-item-section avatar>
                <q-btn flat dense round icon="volume_up" size="sm" color="amber-8" @click="speakPronunciation(w.word, w.pronunciation)" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold">{{ w.word }}</q-item-label>
                <q-item-label caption>{{ w.pronunciation }}</q-item-label>
              </q-item-section>
              <q-item-section side class="text-right">
                <div>{{ homeTranslation(w) }}</div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </template>

      <!-- Generate button (initial) -->
      <div v-if="!loading && !error && words.length === 0" class="text-center q-pa-xl">
        <q-icon name="school" size="64px" color="grey-4" class="q-mb-md" />
        <div class="text-grey-6 q-mb-lg">Ready to learn {{ targetLangName }}?</div>

        <q-select
          v-model="level"
          outlined dense
          label="Level"
          :options="levelOptions"
          emit-value map-options
          class="q-mb-md"
          style="max-width: 200px; margin: 0 auto;"
        />

        <q-btn class="btn-bee" size="lg" no-caps icon="play_arrow" label="Start Lesson" @click="generateLesson" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { backendApi } from 'src/boot/axios'
import { useI18n } from 'src/i18n'

const route = useRoute()
const { lang } = useI18n()
const homeLang = ref('en')
const homeLangName = computed(() => {
  const names: Record<string, string> = {
    zu: 'IsiZulu', xh: 'IsiXhosa', tn: 'Setswana', nso: 'Sepedi',
    st: 'Sesotho', ve: 'Tshivenḓa', ss: 'Siswati', ts: 'Xitsonga', nr: 'isiNdebele',
  }
  return names[homeLang.value] || ''
})
const targetLang = computed(() => (route.params.language as string) || 'setswana')
const targetLangName = computed(() => {
  const names: Record<string, string> = {
    setswana: 'Setswana', afrikaans: 'Afrikaans', english: 'English',
    french: 'French', zulu: 'IsiZulu', xhosa: 'IsiXhosa',
    sepedi: 'Sepedi', sesotho: 'Sesotho', venda: 'Tshivenḓa',
    swati: 'Siswati', tsonga: 'Xitsonga', ndebele: 'isiNdebele',
    spanish: 'Spanish', portuguese: 'Portuguese', swahili: 'Kiswahili (Swahili)',
  }
  return names[targetLang.value] || targetLang.value
})

const loading = ref(false)
const error = ref('')
const words = ref<any[]>([])
const level = ref('beginner')
const phase = ref<'learn' | 'quiz' | 'results'>('learn')

// Flashcard state
const currentIndex = ref(0)
const flipped = ref(false)
const currentWord = computed(() => words.value[currentIndex.value] || {})

// Quiz state
const quizIndex = ref(0)
const quizAnswer = ref(-1)
const quizAnswered = ref(false)
const quizCorrect = ref(false)
const quizScore = ref(0)
const quizWord = computed(() => words.value[quizIndex.value] || {})

const levelOptions = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
]
const levelLabel = computed(() => levelOptions.find(l => l.value === level.value)?.label || '')

// Generate 4 random options for quiz (including correct answer)
const quizOptions = computed(() => {
  if (!quizWord.value.word) return []
  const correct = quizWord.value.word
  const others = words.value
    .filter(w => w.word !== correct)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(w => w.word)
  const options = [correct, ...others].sort(() => Math.random() - 0.5)
  return options
})

// BCP47 codes for Web Speech API — SA languages first, then others
const LANG_BCP47: Record<string, string> = {
  afrikaans: 'af-ZA', zulu: 'zu-ZA', xhosa: 'xh-ZA', setswana: 'tn-ZA',
  sepedi: 'nso', sesotho: 'st-ZA', venda: 've-ZA', swati: 'ss-ZA',
  tsonga: 'ts-ZA', ndebele: 'nr-ZA', english: 'en-ZA',
  french: 'fr-FR', portuguese: 'pt-PT', spanish: 'es-ES', swahili: 'sw',
}

function speakPronunciation(word: string, pronunciation: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()

  const bcp47 = LANG_BCP47[targetLang.value] || 'en-ZA'
  const langPrefix = bcp47.split('-')[0]

  // Wait for voices to be ready, then speak
  const trySpeak = () => {
    const voices = window.speechSynthesis.getVoices()
    // Try to find a native voice for this language
    const nativeVoice = voices.find(v => v.lang === bcp47)
      || voices.find(v => v.lang.startsWith(langPrefix) && langPrefix !== 'en')
      || null

    const utterance = new SpeechSynthesisUtterance()
    if (nativeVoice) {
      // Native voice available — speak the actual word
      utterance.text = word
      utterance.voice = nativeVoice
      utterance.rate = 0.65
    } else {
      // No native voice — speak phonetic guide using English voice
      utterance.text = pronunciation.replace(/-/g, ' ').toLowerCase()
      const enVoice = voices.find(v => v.lang.startsWith('en')) || null
      if (enVoice) utterance.voice = enVoice
      utterance.rate = 0.6
    }
    utterance.pitch = 1.0
    window.speechSynthesis.speak(utterance)
  }

  const voices = window.speechSynthesis.getVoices()
  if (voices.length > 0) trySpeak()
  else window.speechSynthesis.onvoiceschanged = trySpeak
}

function categoryColor(cat: string): string {
  const colors: Record<string, string> = {
    greetings: 'blue', numbers: 'purple', food: 'orange', animals: 'green',
    family: 'pink', directions: 'cyan', shopping: 'amber', weather: 'teal',
    colors: 'red', body: 'indigo',
  }
  return colors[cat] || 'grey'
}

async function generateLesson() {
  loading.value = true
  error.value = ''
  words.value = []
  phase.value = 'learn'
  currentIndex.value = 0
  flipped.value = false
  quizScore.value = 0
  quizIndex.value = 0

  try {
    const { data } = await backendApi.post('/subject-tests/lesson', {
      language: targetLang.value,
      level: level.value,
      home_language: homeLang.value,
    })
    words.value = data.words
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to generate lesson'
  } finally {
    loading.value = false
  }
}

function nextCard() {
  if (currentIndex.value < words.value.length - 1) {
    currentIndex.value++
    flipped.value = false
  }
}

function prevCard() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    flipped.value = false
  }
}

function startQuiz() {
  phase.value = 'quiz'
  quizIndex.value = 0
  quizScore.value = 0
  quizAnswer.value = -1
  quizAnswered.value = false
}

function answerQuiz(optIndex: number) {
  quizAnswer.value = optIndex
  quizAnswered.value = true
  quizCorrect.value = quizOptions.value[optIndex] === quizWord.value.word
  if (quizCorrect.value) quizScore.value++
}

function nextQuizQuestion() {
  if (quizIndex.value < words.value.length - 1) {
    quizIndex.value++
    quizAnswer.value = -1
    quizAnswered.value = false
    quizCorrect.value = false
  } else {
    phase.value = 'results'
  }
}

function resetLearn() {
  phase.value = 'learn'
  currentIndex.value = 0
  flipped.value = false
}

function homeTranslation(w: any): string {
  if (homeLang.value === 'af') return w.translation_af || w.translation_en || w.translation || ''
  if (w.translation_native && homeLangName.value) return w.translation_native
  return w.translation_en || w.translation || ''
}

function homeExample(w: any): string {
  if (homeLang.value === 'af') return w.example_af || w.example_en || w.example_translation || ''
  if (w.example_native && homeLangName.value) return w.example_native
  return w.example_en || w.example_translation || ''
}

onMounted(async () => {
  try {
    const { data } = await backendApi.get('/profile')
    if (data.language) homeLang.value = data.language
  } catch { /* use default en */ }
})
</script>
