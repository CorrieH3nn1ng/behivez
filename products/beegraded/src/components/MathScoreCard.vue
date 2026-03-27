<template>
  <div class="score-card text-center">
    <!-- Star Rating -->
    <div class="stars q-mb-sm">
      <q-icon
        v-for="i in 5"
        :key="i"
        :name="i <= starRating ? 'star' : 'star_border'"
        :color="i <= starRating ? 'amber' : 'grey-4'"
        size="36px"
      />
    </div>

    <!-- Score -->
    <div class="score-display">
      <span class="score-value">{{ animatedScore }}</span>
      <span class="score-divider">/</span>
      <span class="score-total">{{ total }}</span>
    </div>

    <!-- Percentage -->
    <div class="percentage-display">{{ animatedPercentage }}%</div>

    <!-- Time -->
    <div class="time-display text-grey-7">
      <q-icon name="timer" size="16px" class="q-mr-xs" />
      {{ formattedTime }}
    </div>

    <!-- Personal Best Badge -->
    <div v-if="isNewBest" class="best-badge q-mt-sm">
      <q-icon name="emoji_events" color="amber-8" size="20px" class="q-mr-xs" />
      <span>{{ bestLabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'

const props = defineProps<{
  score: number
  total: number
  percentage: number
  timeUsedSec: number
  isNewBest?: boolean
  bestLabel?: string
}>()

const animatedScore = ref(0)
const animatedPercentage = ref(0)

const starRating = computed(() => {
  const pct = props.percentage
  if (pct >= 95) return 5
  if (pct >= 80) return 4
  if (pct >= 60) return 3
  if (pct >= 40) return 2
  return 1
})

const formattedTime = computed(() => {
  const mins = Math.floor(props.timeUsedSec / 60)
  const secs = props.timeUsedSec % 60
  return `${mins}m ${secs.toString().padStart(2, '0')}s`
})

// Animate score counting up
onMounted(() => {
  const duration = 1500
  const steps = 30
  const stepTime = duration / steps
  const scoreStep = props.score / steps
  const pctStep = props.percentage / steps
  let current = 0

  const interval = setInterval(() => {
    current++
    animatedScore.value = Math.min(Math.round(scoreStep * current), props.score)
    animatedPercentage.value = Math.min(Math.round(pctStep * current), Math.round(props.percentage))
    if (current >= steps) {
      animatedScore.value = props.score
      animatedPercentage.value = Math.round(props.percentage)
      clearInterval(interval)
    }
  }, stepTime)
})
</script>

<style scoped>
.score-card {
  padding: 24px;
}
.score-display {
  font-size: 56px;
  font-weight: 800;
  line-height: 1;
  color: #1c1917;
}
.score-value {
  color: #f59e0b;
}
.score-divider {
  color: #d1d5db;
  margin: 0 4px;
}
.score-total {
  color: #6b7280;
}
.percentage-display {
  font-size: 28px;
  font-weight: 700;
  color: #78350f;
  margin-top: 4px;
}
.time-display {
  font-size: 14px;
  margin-top: 8px;
}
.best-badge {
  display: inline-flex;
  align-items: center;
  background: #fef3c7;
  color: #92400e;
  font-weight: 600;
  font-size: 14px;
  padding: 6px 16px;
  border-radius: 20px;
  animation: bounceIn 0.6s ease-out;
}
@keyframes bounceIn {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}
</style>
