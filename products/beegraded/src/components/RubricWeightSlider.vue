<template>
  <div class="q-mb-md">
    <div class="row items-center q-mb-xs">
      <span class="text-weight-bold" style="font-size: 14px;">{{ label }}</span>
      <q-space />
      <q-badge :color="color" text-color="white" style="font-size: 13px;">{{ modelValue }}%</q-badge>
    </div>
    <q-slider
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      :min="5"
      :max="50"
      :step="5"
      :color="color"
      label
      :label-value="`${modelValue ?? 0}%`"
      snap
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  modelValue: number
  color: string
}>()

defineEmits<{
  'update:modelValue': [value: number]
}>()
</script>
