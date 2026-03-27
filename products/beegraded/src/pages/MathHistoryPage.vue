<template>
  <q-page class="honeycomb-bg">
    <div class="page-container" style="max-width: 640px;">
      <div class="row items-center q-mb-md">
        <q-btn flat dense icon="arrow_back" to="/math" />
        <h2 class="text-h5 text-weight-bold q-mb-none q-ml-sm">
          <q-icon name="bar_chart" color="amber" class="q-mr-sm" />
          {{ t('history') }}
        </h2>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner-gears color="amber" size="36px" />
      </div>

      <template v-else>
        <!-- Stats Summary -->
        <q-card v-if="attempts.length > 0" flat class="bee-card q-pa-md q-mb-md">
          <div class="row q-gutter-md justify-center text-center">
            <div>
              <div class="text-h5 text-weight-bold text-amber-8">{{ attempts.length }}</div>
              <div class="text-caption text-grey-6">{{ lang === 'af' ? 'Toetse' : 'Tests' }}</div>
            </div>
            <div>
              <div class="text-h5 text-weight-bold text-amber-8">{{ averageScore }}%</div>
              <div class="text-caption text-grey-6">{{ t('average_score') }}</div>
            </div>
            <div>
              <div class="text-h5 text-weight-bold text-amber-8">{{ bestScore }}%</div>
              <div class="text-caption text-grey-6">{{ t('personal_best') }}</div>
            </div>
          </div>
        </q-card>

        <!-- Progress Chart (simple bar visualization) -->
        <q-card v-if="attempts.length > 1" flat class="bee-card q-pa-md q-mb-md">
          <div class="text-weight-bold q-mb-sm">{{ t('progress') }}</div>
          <div class="progress-bars">
            <div
              v-for="(a, i) in recentForChart"
              :key="i"
              class="progress-bar-item"
            >
              <div
                class="progress-bar-fill"
                :style="{ height: a.percentage + '%', background: barColor(a.percentage) }"
              />
              <div class="progress-bar-label">{{ a.percentage }}%</div>
            </div>
          </div>
        </q-card>

        <!-- Attempt List -->
        <q-card flat class="bee-card q-pa-md">
          <div v-if="attempts.length === 0" class="text-center text-grey-6 q-pa-lg">
            {{ t('no_attempts') }}
          </div>
          <q-list separator>
            <q-item v-for="a in attempts" :key="a.id">
              <q-item-section>
                <q-item-label>{{ a.template_name }}</q-item-label>
                <q-item-label caption>
                  {{ formatDate(a.date) }} &mdash; {{ formatTime(a.time_used_sec) }}
                </q-item-label>
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

      <div class="text-center q-mt-lg">
        <q-btn flat no-caps color="amber-8" :label="t('back_to_home')" to="/math" icon="home" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'src/i18n'
import { useMathTest } from 'src/composables/useMathTest'
import { useMathTestStore } from 'src/stores/math-test'

const { t, lang } = useI18n()
const { getHistory } = useMathTest()
const store = useMathTestStore()

const attempts = ref<any[]>([])
const loading = ref(true)

const averageScore = computed(() => {
  if (attempts.value.length === 0) return 0
  const sum = attempts.value.reduce((acc, a) => acc + a.percentage, 0)
  return Math.round(sum / attempts.value.length)
})

const bestScore = computed(() => {
  if (attempts.value.length === 0) return 0
  return Math.max(...attempts.value.map(a => a.percentage))
})

const recentForChart = computed(() => {
  return [...attempts.value].reverse().slice(-10)
})

function barColor(pct: number): string {
  if (pct >= 80) return '#16a34a'
  if (pct >= 50) return '#f59e0b'
  return '#d1d5db'
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(lang.value === 'af' ? 'af-ZA' : 'en-ZA', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatTime(sec: number) {
  const mins = Math.floor(sec / 60)
  const secs = sec % 60
  return `${mins}m ${secs.toString().padStart(2, '0')}s`
}

onMounted(async () => {
  try {
    const data = await getHistory(store.playerName || undefined)
    attempts.value = data.attempts
  } catch {
    attempts.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.progress-bars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 100px;
  padding: 0 4px;
}
.progress-bar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
}
.progress-bar-fill {
  width: 100%;
  max-width: 30px;
  border-radius: 4px 4px 0 0;
  transition: height 0.5s ease;
  min-height: 4px;
}
.progress-bar-label {
  font-size: 10px;
  color: #6b7280;
  margin-top: 2px;
}
</style>
