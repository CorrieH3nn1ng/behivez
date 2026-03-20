<template>
  <q-card flat bordered class="product-card" style="border-radius: 12px;">
    <q-img v-if="product.image_url" :src="product.image_url" :ratio="1" :alt="product.name" />
    <div v-else class="flex flex-center bg-brown-1" style="aspect-ratio: 1;">
      <q-icon name="shopping_bag" size="48px" color="brown-3" />
    </div>

    <q-badge v-if="!product.in_stock" color="grey-7" floating label="Out of Stock" />

    <q-card-section>
      <div class="text-subtitle1 text-weight-bold ellipsis">{{ product.name }}</div>
      <div v-if="product.description" class="text-caption text-grey-7 ellipsis-2-lines q-mt-xs">{{ product.description }}</div>
      <div class="text-subtitle2 text-amber-10 q-mt-xs">
        <span v-if="product.price_label">{{ product.price_label }}</span>
        <span v-else-if="product.price != null">R{{ Number(product.price).toFixed(0) }}</span>
      </div>
    </q-card-section>

    <q-card-actions class="q-px-md q-pb-md">
      <q-btn
        color="brown-8"
        no-caps
        class="full-width"
        :label="product.in_stock ? 'I Want This' : 'Out of Stock'"
        :disable="!product.in_stock"
        @click="$emit('enquire', product)"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import type { Product } from 'src/stores/talent'

defineProps<{ product: Product }>()
defineEmits<{ enquire: [product: Product] }>()
</script>

<style lang="scss" scoped>
.product-card {
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
}
</style>
