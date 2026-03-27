<template>
  <div class="leaderboard-row" :class="{ 'is-current': isCurrentPlayer }">
    <span class="rank-col">
      <template v-if="rank === 1">&#129351;</template>
      <template v-else-if="rank === 2">&#129352;</template>
      <template v-else-if="rank === 3">&#129353;</template>
      <template v-else>{{ rank }}</template>
    </span>
    <span class="name-col">
      {{ playerName }}
      <q-badge v-if="isCurrentPlayer" color="amber-8" class="q-ml-xs" dense>
        {{ youLabel }}
      </q-badge>
    </span>
    <span class="score-col">{{ score }}/{{ total }}</span>
    <span class="pct-col">{{ percentage }}%</span>
    <span class="time-col">{{ formattedTime }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  rank: number
  playerName: string
  score: number
  total: number
  percentage: number
  timeUsedSec: number
  isCurrentPlayer?: boolean
  youLabel?: string
}>()

const formattedTime = computed(() => {
  const mins = Math.floor(props.timeUsedSec / 60)
  const secs = props.timeUsedSec % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
})
</script>

<style scoped>
.leaderboard-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  transition: background 0.2s;
}
.leaderboard-row:nth-child(odd) {
  background: #fefce8;
}
.is-current {
  background: #fef3c7 !important;
  font-weight: 600;
  border: 2px solid #f59e0b;
}
.rank-col {
  min-width: 32px;
  text-align: center;
  font-weight: 700;
  font-size: 18px;
}
.name-col {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.score-col {
  min-width: 50px;
  text-align: right;
  font-weight: 600;
}
.pct-col {
  min-width: 40px;
  text-align: right;
  color: #78350f;
  font-weight: 600;
}
.time-col {
  min-width: 45px;
  text-align: right;
  color: #6b7280;
  font-size: 13px;
}
</style>
