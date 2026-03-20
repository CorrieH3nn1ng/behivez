<template>
  <div class="cost-summary">
    <div class="text-subtitle2 q-mb-sm">Cost Breakdown</div>

    <div class="cost-bar q-mb-md" v-if="total > 0">
      <div
        v-for="cat in categories"
        :key="cat.key"
        :style="{ width: (cat.amount / total * 100) + '%', backgroundColor: cat.color }"
        class="cost-bar-segment"
      />
    </div>
    <div v-else class="text-caption text-grey-5 q-mb-md">No costs recorded yet</div>

    <div v-for="cat in categories" :key="cat.key" class="row items-center q-mb-xs">
      <div class="cost-dot q-mr-sm" :style="{ backgroundColor: cat.color }" />
      <div class="col text-caption">{{ cat.label }}</div>
      <div class="text-caption text-weight-medium">R{{ cat.amount.toLocaleString() }}</div>
    </div>

    <q-separator class="q-my-sm" />
    <div class="row items-center">
      <div class="col text-subtitle2">Total</div>
      <div class="text-subtitle2 text-weight-bold">R{{ total.toLocaleString() }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStatusLogStore } from 'stores/statusLog';

const props = defineProps<{ vehicleId: string }>();
const statusLogStore = useStatusLogStore();

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  fuel:     { label: 'Fuel',     color: '#f59e0b' },
  service:  { label: 'Service',  color: '#8b5cf6' },
  repair:   { label: 'Repair',   color: '#ef4444' },
  cleaning: { label: 'Cleaning', color: '#06b6d4' },
  accident: { label: 'Accident', color: '#dc2626' },
  other:    { label: 'Other',    color: '#6b7280' },
};

const categories = computed(() => {
  const breakdown = statusLogStore.costBreakdown(props.vehicleId);
  return Object.entries(breakdown)
    .filter(([, amount]) => amount > 0)
    .map(([key, amount]) => ({
      key,
      amount,
      label: CATEGORY_META[key]?.label || key,
      color: CATEGORY_META[key]?.color || '#999',
    }));
});

const total = computed(() => categories.value.reduce((s, c) => s + c.amount, 0));
</script>

<style scoped>
.cost-bar {
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  background: #e5e7eb;
}
.cost-bar-segment {
  min-width: 4px;
}
.cost-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
</style>
