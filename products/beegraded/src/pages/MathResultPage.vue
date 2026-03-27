<template>
  <q-page class="honeycomb-bg">
    <div class="page-container" style="max-width: 640px;">
      <!-- Loading -->
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner-gears color="amber" size="48px" />
      </div>

      <template v-else-if="result">
        <!-- Encouragement -->
        <div class="text-center q-mb-md">
          <div class="text-h4 text-weight-bold" style="color: #78350f;">
            {{ encouragement }}
          </div>
        </div>

        <!-- Score Card -->
        <q-card flat class="bee-card q-mb-md">
          <MathScoreCard
            :score="result.score"
            :total="result.total"
            :percentage="result.percentage"
            :time-used-sec="result.time_used_sec"
            :is-new-best="result.is_new_best"
            :best-label="t('new_personal_best')"
          />
        </q-card>

        <!-- Wrong Answers -->
        <q-card v-if="wrongAnswers.length > 0" flat class="bee-card q-pa-md q-mb-md">
          <div class="text-weight-bold q-mb-sm">
            <q-icon name="highlight_off" color="red-6" class="q-mr-xs" />
            {{ t('questions_missed') }} ({{ wrongAnswers.length }})
          </div>
          <div v-for="a in wrongAnswers" :key="a.questionIndex" class="wrong-answer-row">
            <span class="text-grey-7">{{ t('question') }} {{ a.questionIndex + 1 }}:</span>
            <span class="q-ml-sm">{{ a.question }} = </span>
            <span class="text-red-6 text-weight-bold q-ml-xs text-strike">{{ a.givenAnswer }}</span>
            <span class="q-ml-sm text-positive text-weight-bold">
              ({{ t('correct_answer') }}: {{ a.correctAnswer }})
            </span>
          </div>
        </q-card>

        <!-- Inline Leaderboard -->
        <q-card v-if="leaderboard.length > 0" flat class="bee-card q-pa-md q-mb-md">
          <div class="text-weight-bold q-mb-sm">
            <q-icon name="leaderboard" color="amber-8" class="q-mr-xs" />
            {{ t('leaderboard') }} ({{ t('grade') }} {{ result.grade }})
          </div>
          <MathLeaderboardEntry
            v-for="entry in leaderboard"
            :key="entry.rank"
            :rank="entry.rank"
            :player-name="entry.player_name"
            :score="entry.score"
            :total="entry.total"
            :percentage="entry.percentage"
            :time-used-sec="entry.time_used_sec"
            :is-current-player="entry.player_name === playerName"
            :you-label="t('you')"
          />
        </q-card>

        <!-- Action Buttons -->
        <div class="row q-gutter-md justify-center q-mt-lg q-mb-xl">
          <q-btn
            class="btn-bee"
            size="lg"
            no-caps
            icon="replay"
            :label="t('try_again')"
            :loading="generating"
            @click="tryAgain"
          />
          <q-btn
            outline
            color="amber-8"
            size="lg"
            no-caps
            icon="add"
            :label="t('new_test')"
            to="/math"
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
import { useMathTestStore } from 'src/stores/math-test'
import MathScoreCard from 'src/components/MathScoreCard.vue'
import MathLeaderboardEntry from 'src/components/MathLeaderboardEntry.vue'
import { Notify } from 'quasar'

const { t, lang } = useI18n()
const { getAttempt, getLeaderboard, generateTest } = useMathTest()
const store = useMathTestStore()
const route = useRoute()
const router = useRouter()

const result = ref<any>(null)
const leaderboard = ref<any[]>([])
const loading = ref(true)
const generating = ref(false)
const error = ref('')
const playerName = store.playerName

const wrongAnswers = computed(() => {
  if (!result.value?.answers) return []
  return result.value.answers.filter((a: any) => !a.correct)
})

const encouragement = computed(() => {
  if (!result.value) return ''
  const pct = result.value.percentage
  if (pct >= 95) return t('score_amazing')
  if (pct >= 80) return t('score_well_done')
  if (pct >= 50) return t('score_good_effort')
  return t('score_keep_practicing')
})

async function tryAgain() {
  generating.value = true
  try {
    const template = await generateTest({
      grade: result.value.grade,
      language: lang.value,
    })
    store.reset()
    router.push({ name: 'math-test', params: { templateId: template.id } })
  } catch (err: any) {
    Notify.create({ type: 'negative', message: 'Failed to generate new test' })
  } finally {
    generating.value = false
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
    const [attemptData, leaderboardData] = await Promise.all([
      getAttempt(templateId, attemptId),
      getLeaderboard(4), // Default to grade 4, will be updated
    ])
    result.value = attemptData
    leaderboard.value = leaderboardData.leaderboard.slice(0, 5)

    // Re-fetch leaderboard with correct grade if different
    if (attemptData.template?.grade && attemptData.template.grade !== 4) {
      const correctBoard = await getLeaderboard(attemptData.template.grade)
      leaderboard.value = correctBoard.leaderboard.slice(0, 5)
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load results'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.wrong-answer-row {
  padding: 4px 0;
  font-size: 14px;
  border-bottom: 1px solid #f3f4f6;
}
.wrong-answer-row:last-child {
  border-bottom: none;
}
</style>
