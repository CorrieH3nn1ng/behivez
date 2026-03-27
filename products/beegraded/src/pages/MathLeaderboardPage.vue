<template>
  <q-page class="honeycomb-bg">
    <div class="page-container" style="max-width: 640px;">
      <div class="row items-center q-mb-md">
        <q-btn flat dense icon="arrow_back" to="/math" />
        <h2 class="text-h5 text-weight-bold q-mb-none q-ml-sm">
          <q-icon name="leaderboard" color="amber" class="q-mr-sm" />
          {{ t('leaderboard') }}
        </h2>
      </div>

      <!-- Grade Filter -->
      <q-select
        v-model="selectedGrade"
        outlined
        :label="t('grade')"
        :options="gradeOptions"
        emit-value
        map-options
        class="q-mb-md"
        @update:model-value="loadLeaderboard"
      />

      <!-- Loading -->
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner-gears color="amber" size="36px" />
      </div>

      <!-- Leaderboard -->
      <q-card v-else flat class="bee-card q-pa-md">
        <div v-if="entries.length === 0" class="text-center text-grey-6 q-pa-lg">
          {{ t('no_attempts') }}
        </div>
        <MathLeaderboardEntry
          v-for="entry in entries"
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

      <div class="text-center q-mt-lg">
        <q-btn flat no-caps color="amber-8" :label="t('back_to_home')" to="/math" icon="home" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'src/i18n'
import { useMathTest } from 'src/composables/useMathTest'
import { useMathTestStore } from 'src/stores/math-test'
import MathLeaderboardEntry from 'src/components/MathLeaderboardEntry.vue'

const { t } = useI18n()
const { getLeaderboard } = useMathTest()
const store = useMathTestStore()

const playerName = store.playerName
const selectedGrade = ref(4)
const entries = ref<any[]>([])
const loading = ref(true)

const gradeOptions = [
  { label: 'Gr 1', value: 1 },
  { label: 'Gr 2', value: 2 },
  { label: 'Gr 3', value: 3 },
  { label: 'Gr 4', value: 4 },
  { label: 'Gr 5', value: 5 },
  { label: 'Gr 6', value: 6 },
  { label: 'Gr 7', value: 7 },
]

async function loadLeaderboard() {
  loading.value = true
  try {
    const data = await getLeaderboard(selectedGrade.value)
    entries.value = data.leaderboard
  } catch {
    entries.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => loadLeaderboard())
</script>
