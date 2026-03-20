<template>
  <q-badge :color="config.color" :label="config.label" class="status-badge">
    <q-icon :name="config.icon" size="14px" class="q-mr-xs" />
    {{ config.label }}
  </q-badge>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { STATUS_CONFIG } from 'src/types';
import type { VehicleStatus } from 'src/types';

const props = defineProps<{ status: VehicleStatus }>();
const config = computed(() => STATUS_CONFIG[props.status]);
</script>

<style scoped>
.status-badge {
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 12px;
}
</style>
