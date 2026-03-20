<template>
  <q-page class="q-pa-lg">
    <div class="row items-center q-mb-md">
      <h4 class="text-h5 text-weight-bold q-mt-none q-mb-none col">Shop</h4>
      <q-btn color="brown-8" no-caps icon="add" label="Add Product" @click="openNew" />
    </div>

    <div v-if="loading" class="flex flex-center q-pa-xl">
      <q-spinner-gears size="48px" color="brown-8" />
    </div>

    <div v-else-if="!products.length" class="text-center q-pa-xl text-grey-6">
      <q-icon name="shopping_bag" size="48px" class="q-mb-md" />
      <p class="text-h6">No products yet</p>
      <p>Add products to your storefront — visitors can enquire about them.</p>
    </div>

    <q-list v-else bordered separator class="rounded-borders">
      <q-item v-for="(p, idx) in products" :key="p.id">
        <q-item-section avatar>
          <q-avatar rounded size="56px">
            <img v-if="p.image_url" :src="p.image_url" :alt="p.name" />
            <q-icon v-else name="shopping_bag" color="brown-3" />
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-bold">{{ p.name }}</q-item-label>
          <q-item-label caption>
            <span v-if="p.price_label">{{ p.price_label }}</span>
            <span v-else-if="p.price != null">R{{ Number(p.price).toFixed(0) }}</span>
          </q-item-label>
          <q-item-label caption>
            <q-badge :color="p.in_stock ? 'positive' : 'grey'" :label="p.in_stock ? 'In Stock' : 'Out of Stock'" />
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <div class="column items-center q-gutter-xs">
            <q-btn flat dense round icon="arrow_upward" size="xs" :disable="idx === 0" @click="handleReorder(p.id, idx - 1)" />
            <q-btn flat dense round icon="arrow_downward" size="xs" :disable="idx === products.length - 1" @click="handleReorder(p.id, idx + 1)" />
          </div>
        </q-item-section>
        <q-item-section side>
          <div class="row q-gutter-xs">
            <q-btn flat dense icon="edit" @click="openEdit(p)" />
            <q-btn flat dense icon="delete" color="negative" @click="handleDelete(p.id)" />
          </div>
        </q-item-section>
      </q-item>
    </q-list>

    <product-form
      v-model="dialogOpen"
      :product="editingProduct"
      :talent-id="talentId"
      @saved="onSaved"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTalentStore, type Product } from 'src/stores/talent'
import ProductForm from 'src/components/ProductForm.vue'
import { Notify, Dialog } from 'quasar'

const talentStore = useTalentStore()
const loading = ref(true)
const products = ref<Product[]>([])
const dialogOpen = ref(false)
const editingProduct = ref<Product | null>(null)
const talentId = ref(0)

async function loadProducts() {
  loading.value = true
  try {
    const mine = await talentStore.fetchMine()
    talentId.value = mine.id
    products.value = await talentStore.fetchProducts(mine.id)
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

onMounted(loadProducts)

function openNew() {
  editingProduct.value = null
  dialogOpen.value = true
}

function openEdit(p: Product) {
  editingProduct.value = { ...p }
  dialogOpen.value = true
}

function onSaved() {
  dialogOpen.value = false
  loadProducts()
}

function handleDelete(id: number) {
  Dialog.create({
    title: 'Delete Product',
    message: 'Remove this product from your shop?',
    cancel: true,
  }).onOk(async () => {
    try {
      await talentStore.deleteProduct(id)
      products.value = products.value.filter(p => p.id !== id)
      Notify.create({ type: 'positive', message: 'Product deleted' })
    } catch {
      Notify.create({ type: 'negative', message: 'Failed to delete' })
    }
  })
}

async function handleReorder(id: number, newIndex: number) {
  try {
    await talentStore.reorderProducts(id, newIndex)
    await loadProducts()
  } catch {
    Notify.create({ type: 'negative', message: 'Failed to reorder' })
  }
}
</script>
