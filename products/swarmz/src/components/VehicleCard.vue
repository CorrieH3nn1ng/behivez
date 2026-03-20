<template>
  <q-card class="vehicle-card cursor-pointer" @click="$emit('click')">
    <q-card-section horizontal>
      <q-card-section class="col-3 flex flex-center">
        <q-avatar size="60px" :color="vehicle.photoUrl ? undefined : 'grey-3'" :text-color="vehicle.photoUrl ? undefined : 'grey-6'">
          <img v-if="vehicle.photoUrl" :src="vehicle.photoUrl" />
          <q-icon v-else name="directions_car" size="30px" />
        </q-avatar>
      </q-card-section>

      <q-card-section class="col">
        <div class="text-subtitle1 text-weight-bold">{{ vehicle.registration }}</div>
        <div class="text-caption text-grey-7">{{ vehicle.make }} {{ vehicle.model }} &middot; {{ vehicle.year }}</div>
        <div class="q-mt-xs">
          <StatusBadge :status="vehicle.currentStatus" />
        </div>
      </q-card-section>

      <q-card-section class="col-auto flex flex-center">
        <div class="text-right">
          <div class="text-caption text-grey-6">This month</div>
          <div class="text-subtitle2 text-weight-bold">R{{ vehicle.monthlySpend.toLocaleString() }}</div>
        </div>
      </q-card-section>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { Vehicle } from 'src/types';
import StatusBadge from './StatusBadge.vue';

defineProps<{ vehicle: Vehicle }>();
defineEmits(['click']);
</script>

<style scoped>
.vehicle-card {
  border-radius: 12px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.vehicle-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}
</style>
