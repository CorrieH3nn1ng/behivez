<template>
  <q-card flat bordered class="q-pa-md" style="border-radius: 12px;">
    <div class="text-subtitle1 text-weight-bold">{{ service.name }}</div>
    <p v-if="service.description" class="text-body2 text-grey-7 q-mb-sm q-mt-xs">{{ service.description }}</p>
    <div class="row items-center q-gutter-sm">
      <q-badge v-if="priceDisplay" color="amber" text-color="brown-10" class="text-weight-bold">
        {{ priceDisplay }}
      </q-badge>
      <span v-if="service.duration" class="text-caption text-grey-6">{{ service.duration }}</span>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Service } from 'src/stores/talent'

const props = defineProps<{ service: Service }>()

const priceDisplay = computed(() => {
  if (props.service.price_label) return props.service.price_label
  if (props.service.price != null) return `R${Number(props.service.price).toFixed(0)}`
  return null
})
</script>
