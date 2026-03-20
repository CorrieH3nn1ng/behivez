<template>
  <div>
    <div class="text-subtitle2 q-mb-sm">Color Theme</div>
    <div class="row q-gutter-sm">
      <div
        v-for="t in themes"
        :key="t.id"
        class="theme-swatch cursor-pointer"
        :class="{ active: modelValue === t.id }"
        :style="{ background: `linear-gradient(135deg, ${t.heroBg}, ${t.accent})` }"
        @click="$emit('update:modelValue', t.id)"
      >
        <q-tooltip>{{ t.name }}</q-tooltip>
        <q-icon v-if="modelValue === t.id" name="check" color="white" size="20px" />
      </div>
    </div>
    <div class="text-caption text-grey-6 q-mt-xs">{{ currentThemeName }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ modelValue: string }>()
defineEmits<{ 'update:modelValue': [val: string] }>()

const themes = [
  { id: 'earth', name: 'Earth', heroBg: '#3e2723', accent: '#ffc107' },
  { id: 'earth-light', name: 'Earth Light', heroBg: '#efebe9', accent: '#8d6e63' },
  { id: 'ocean', name: 'Ocean', heroBg: '#37474f', accent: '#00bcd4' },
  { id: 'ocean-light', name: 'Ocean Light', heroBg: '#e0f7fa', accent: '#00838f' },
  { id: 'sunset', name: 'Sunset', heroBg: '#bf360c', accent: '#ff9800' },
  { id: 'sunset-light', name: 'Sunset Light', heroBg: '#fff3e0', accent: '#e65100' },
  { id: 'forest', name: 'Forest', heroBg: '#1b5e20', accent: '#8bc34a' },
  { id: 'forest-light', name: 'Forest Light', heroBg: '#e8f5e9', accent: '#2e7d32' },
  { id: 'slate', name: 'Slate', heroBg: '#263238', accent: '#90a4ae' },
  { id: 'slate-light', name: 'Slate Light', heroBg: '#eceff1', accent: '#455a64' },
  { id: 'blossom', name: 'Blossom', heroBg: '#880e4f', accent: '#f48fb1' },
  { id: 'blossom-light', name: 'Blossom Light', heroBg: '#fce4ec', accent: '#e91e63' },
]

const currentThemeName = computed(() => themes.find(t => t.id === props.modelValue)?.name || 'Earthy')
</script>

<style lang="scss" scoped>
.theme-swatch {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid transparent;
  transition: all 0.2s;

  &.active {
    border-color: #5d4037;
    transform: scale(1.1);
  }

  &:hover {
    transform: scale(1.05);
  }
}
</style>
