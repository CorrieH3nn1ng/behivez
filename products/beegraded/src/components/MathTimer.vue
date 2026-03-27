<template>
  <div class="math-timer" :class="timerClass">
    <q-icon name="timer" size="24px" class="q-mr-xs" />
    <span class="timer-display">{{ formattedTime }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'

const props = defineProps<{
  timeRemaining: number
  totalSeconds: number
}>()

const emit = defineEmits<{
  'time-up': []
}>()

const formattedTime = computed(() => {
  const mins = Math.floor(props.timeRemaining / 60)
  const secs = props.timeRemaining % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
})

const percentRemaining = computed(() =>
  props.totalSeconds > 0 ? props.timeRemaining / props.totalSeconds : 0
)

const timerClass = computed(() => {
  if (percentRemaining.value > 0.5) return 'timer-green'
  if (percentRemaining.value > 0.25) return 'timer-amber'
  return 'timer-red'
})

watch(() => props.timeRemaining, (val) => {
  if (val <= 0) emit('time-up')
})
</script>

<style scoped>
.math-timer {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 28px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  transition: background-color 0.5s, color 0.5s;
}
.timer-green {
  background: #dcfce7;
  color: #166534;
}
.timer-amber {
  background: #fef3c7;
  color: #92400e;
}
.timer-red {
  background: #fee2e2;
  color: #991b1b;
  animation: pulse 1s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
.timer-display {
  min-width: 80px;
  text-align: center;
}
</style>
