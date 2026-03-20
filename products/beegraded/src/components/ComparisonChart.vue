<template>
  <div class="comparison-chart">
    <div v-for="criterion in criteria" :key="criterion.key" class="criterion-row q-mb-md">
      <div class="criterion-label text-weight-bold" style="font-size: 13px; min-width: 160px;">
        {{ criterion.label }}
      </div>
      <div class="bars-container">
        <div class="bar-row">
          <div class="bar-label text-grey-6" style="font-size: 10px; width: 40px;">Draft</div>
          <div class="bar-track">
            <div
              class="bar-fill draft-bar"
              :style="{ width: `${criterion.draft}%` }"
            >
              <span v-if="criterion.draft > 15">{{ criterion.draft }}%</span>
            </div>
          </div>
          <div class="bar-value" style="width: 40px; text-align: right;">{{ criterion.draft }}%</div>
        </div>
        <div class="bar-row q-mt-xs">
          <div class="bar-label text-grey-6" style="font-size: 10px; width: 40px;">Final</div>
          <div class="bar-track">
            <div
              class="bar-fill final-bar"
              :style="{ width: `${criterion.final}%` }"
            >
              <span v-if="criterion.final > 15">{{ criterion.final }}%</span>
            </div>
          </div>
          <div class="bar-value" style="width: 40px; text-align: right;">
            {{ criterion.final }}%
            <q-icon
              v-if="criterion.final > criterion.draft"
              name="arrow_upward"
              color="positive"
              size="12px"
            />
            <q-icon
              v-else-if="criterion.final < criterion.draft"
              name="arrow_downward"
              color="negative"
              size="12px"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  criteria: Array<{
    key: string
    label: string
    draft: number
    final: number
  }>
}>()
</script>

<style scoped>
.criterion-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.bars-container {
  flex: 1;
}
.bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bar-track {
  flex: 1;
  height: 18px;
  background: #e5e7eb;
  border-radius: 9px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 9px;
  display: flex;
  align-items: center;
  padding-left: 8px;
  color: white;
  font-size: 11px;
  font-weight: 700;
  transition: width 0.8s ease;
  min-width: 0;
}
.draft-bar {
  background: linear-gradient(90deg, #94a3b8, #64748b);
}
.final-bar {
  background: linear-gradient(90deg, #fbbf24, #d97706);
}
.bar-value {
  font-weight: 700;
  font-size: 13px;
  color: #1c1917;
}

@media (max-width: 600px) {
  .criterion-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .criterion-label {
    min-width: auto;
  }
  .bars-container {
    width: 100%;
  }
}
</style>
