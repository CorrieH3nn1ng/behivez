<template>
  <div class="score-gauge text-center">
    <div class="gauge-circle" :style="circleStyle">
      <svg viewBox="0 0 120 120" class="gauge-svg">
        <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" stroke-width="8" />
        <circle
          cx="60" cy="60" r="52"
          fill="none"
          :stroke="color"
          stroke-width="8"
          stroke-linecap="round"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="dashOffset"
          transform="rotate(-90 60 60)"
          style="transition: stroke-dashoffset 1s ease"
        />
      </svg>
      <div class="gauge-value">
        <div class="gauge-number" :style="{ color }">{{ Math.round(score) }}%</div>
        <div class="gauge-label-text">{{ label }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  score: number
  label: string
  size?: number
}>(), {
  size: 120,
})

const circumference = 2 * Math.PI * 52
const dashOffset = computed(() => circumference - (props.score / 100) * circumference)

const color = computed(() => {
  if (props.score >= 75) return '#22c55e'
  if (props.score >= 60) return '#3b82f6'
  if (props.score >= 50) return '#f59e0b'
  return '#ef4444'
})

const circleStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
}))
</script>

<style scoped>
.gauge-circle {
  position: relative;
  display: inline-block;
}
.gauge-svg {
  width: 100%;
  height: 100%;
}
.gauge-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}
.gauge-number {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.1;
}
.gauge-label-text {
  font-size: 10px;
  color: #78716c;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
}
</style>
