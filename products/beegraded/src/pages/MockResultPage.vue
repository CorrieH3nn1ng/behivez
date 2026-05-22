<template>
  <q-page class="honeycomb-bg">
    <div class="page-container" style="max-width: 640px;">
      <!-- Loading -->
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner-gears color="amber" size="48px" />
      </div>

      <template v-else-if="result">
        <!-- Title -->
        <div class="text-center q-mb-md">
          <div class="text-h4 text-weight-bold" style="color: #78350f;">
            {{ encouragement }}
          </div>
          <div class="text-subtitle1 text-grey-7 q-mt-xs">
            {{ result.template?.name || (lang === 'af' ? 'Proefsitting' : 'Mock Assessment') }}
            &nbsp;·&nbsp; {{ lang === 'af' ? 'Graad' : 'Grade' }} {{ result.template?.grade }}
          </div>
        </div>

        <!-- Overall Score -->
        <q-card flat class="bee-card q-pa-lg q-mb-md text-center">
          <div class="text-h2 text-weight-bold" :style="{ color: scoreColor }">
            {{ result.percentage }}%
          </div>
          <div class="text-body2 text-grey-7 q-mt-xs">
            {{ result.score }} / {{ result.total }} {{ lang === 'af' ? 'korrek' : 'correct' }}
            &nbsp;·&nbsp;
            {{ formattedTime }}
          </div>
        </q-card>

        <!-- Per-topic breakdown -->
        <template v-if="topicStats.length > 0">
          <!-- Topics needing attention -->
          <q-card v-if="weakTopics.length > 0" flat class="bee-card q-pa-md q-mb-md">
            <div class="text-weight-bold q-mb-sm text-red-7">
              <q-icon name="flag" class="q-mr-xs" />
              {{ lang === 'af' ? 'Fokus hierop' : 'Focus on these' }}
            </div>
            <div v-for="s in weakTopics" :key="s.topic" class="topic-row q-py-sm">
              <div class="row items-center no-wrap">
                <div class="col topic-label text-grey-8">{{ s.topic }}</div>
                <div class="col-auto row items-center q-gutter-xs">
                  <span class="text-caption text-grey-6">{{ s.correct }}/{{ s.total }}</span>
                  <q-badge :color="topicColor(s.percentage)" text-color="white">
                    {{ s.percentage }}%
                  </q-badge>
                </div>
              </div>
              <q-linear-progress
                :value="s.percentage / 100"
                :color="topicColor(s.percentage)"
                rounded size="6px"
                class="q-mt-xs"
              />
            </div>
          </q-card>

          <!-- Topics doing well -->
          <q-card v-if="strongTopics.length > 0" flat class="bee-card q-pa-md q-mb-md">
            <div class="text-weight-bold q-mb-sm text-positive">
              <q-icon name="check_circle" class="q-mr-xs" />
              {{ lang === 'af' ? 'Goed gedoen!' : 'Well done!' }}
            </div>
            <div v-for="s in strongTopics" :key="s.topic" class="topic-row q-py-sm">
              <div class="row items-center no-wrap">
                <div class="col topic-label text-grey-8">{{ s.topic }}</div>
                <div class="col-auto row items-center q-gutter-xs">
                  <span class="text-caption text-grey-6">{{ s.correct }}/{{ s.total }}</span>
                  <q-badge color="positive" text-color="white">{{ s.percentage }}%</q-badge>
                </div>
              </div>
              <q-linear-progress
                :value="s.percentage / 100"
                color="positive"
                rounded size="6px"
                class="q-mt-xs"
              />
            </div>
          </q-card>
        </template>

        <!-- Actions -->
        <div class="row q-gutter-md justify-center q-mt-lg q-mb-xl">
          <q-btn
            outline
            color="grey-7"
            size="lg"
            no-caps
            icon="arrow_back"
            :label="lang === 'af' ? 'Nuwe toets' : 'New assessment'"
            to="/workspace/mock"
          />
          <q-btn
            class="btn-bee"
            size="lg"
            no-caps
            icon="replay"
            :label="lang === 'af' ? 'Herprobeer' : 'Try again'"
            :loading="regenerating"
            @click="tryAgain"
          />
        </div>
      </template>

      <!-- Error -->
      <q-banner v-if="error" class="bg-red-1 text-red-8 q-mt-md" rounded>
        <template #avatar><q-icon name="error" /></template>
        {{ error }}
      </q-banner>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'src/i18n'
import { useMathTest } from 'src/composables/useMathTest'
import { backendApi } from 'src/boot/axios'

const { lang } = useI18n()
const { getAttempt } = useMathTest()
const route = useRoute()
const router = useRouter()

const result = ref<any>(null)
const loading = ref(true)
const regenerating = ref(false)
const error = ref('')

interface TopicStat {
  topic: string
  correct: number
  total: number
  percentage: number
}

const topicStats = computed((): TopicStat[] => {
  const questions: any[] = result.value?.template?.questions || []
  const answers: any[] = result.value?.answers || []
  if (!questions.length || !answers.length) return []

  const map = new Map<string, { correct: number; total: number }>()
  for (const answer of answers) {
    const q = questions[answer.questionIndex]
    const topic: string = q?.scope_topic || 'General'
    if (!map.has(topic)) map.set(topic, { correct: 0, total: 0 })
    const stat = map.get(topic)!
    stat.total++
    if (answer.correct) stat.correct++
  }

  return Array.from(map.entries())
    .map(([topic, stat]) => ({
      topic,
      correct: stat.correct,
      total: stat.total,
      percentage: Math.round((stat.correct / stat.total) * 100),
    }))
    .sort((a, b) => a.percentage - b.percentage)
})

const weakTopics = computed(() => topicStats.value.filter(s => s.percentage < 75))
const strongTopics = computed(() => topicStats.value.filter(s => s.percentage >= 75))

const scoreColor = computed(() => {
  const pct = result.value?.percentage || 0
  if (pct >= 75) return '#16a34a'
  if (pct >= 50) return '#d97706'
  return '#dc2626'
})

const encouragement = computed(() => {
  const pct = result.value?.percentage || 0
  if (lang.value === 'af') {
    if (pct >= 90) return 'Uitstekend! 🌟'
    if (pct >= 75) return 'Goed gedoen!'
    if (pct >= 50) return 'Goeie poging!'
    return 'Oefen meer!'
  }
  if (pct >= 90) return 'Outstanding!'
  if (pct >= 75) return 'Well done!'
  if (pct >= 50) return 'Good effort!'
  return 'Keep practising!'
})

const formattedTime = computed(() => {
  const sec = result.value?.time_used_sec || 0
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0
    ? `${m}m ${s}s`
    : `${s}s`
})

function topicColor(pct: number): string {
  if (pct >= 75) return 'positive'
  if (pct >= 50) return 'warning'
  return 'negative'
}

async function tryAgain() {
  if (!result.value?.template) return
  regenerating.value = true
  try {
    const tpl = result.value.template
    // Reconstruct original scope from question scope_topics
    const questions: any[] = result.value?.template?.questions || []
    const scopeSet = new Set<string>(questions.map((q: any) => q.scope_topic).filter(Boolean))
    const scope = Array.from(scopeSet)
    // Extract subject name from template name (format: "Subject Gr X — Mock Assessment")
    const subjectName = tpl.name?.replace(/ Gr \d+.*$/, '') || tpl.name || 'General Revision'

    const { data } = await backendApi.post('/subject-tests/mock', {
      subject_name: subjectName,
      grade: tpl.grade,
      scope: scope.length > 0 ? scope : ['general revision'],
      language: 'english',
    })
    router.push({
      name: 'math-test',
      params: { templateId: data.id },
      query: { returnTo: 'mock-result', templateId: String(data.id) },
    })
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to generate new assessment'
  } finally {
    regenerating.value = false
  }
}

onMounted(async () => {
  const attemptId = Number(route.params.attemptId)
  const templateId = Number(route.query.templateId)

  if (isNaN(attemptId) || isNaN(templateId)) {
    error.value = 'Invalid attempt ID'
    loading.value = false
    return
  }

  try {
    result.value = await getAttempt(templateId, attemptId)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load results'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.topic-row {
  border-bottom: 1px solid #f3f4f6;
}
.topic-row:last-child {
  border-bottom: none;
}
.topic-label {
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 280px;
}
</style>
