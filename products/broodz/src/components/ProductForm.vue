<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="min-width: 420px; max-width: 500px;">
      <q-card-section class="text-h6">
        {{ product ? 'Edit Product' : 'Add Product' }}
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="handleSave" class="q-gutter-sm">
          <q-input v-model="form.name" label="Product Name" outlined dense :rules="[v => !!v || 'Required']" />
          <q-input v-model="form.description" label="Description" type="textarea" outlined dense autogrow />

          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <q-input v-model.number="form.price" label="Price (R)" type="number" outlined dense />
            </div>
            <div class="col-6">
              <q-input v-model="form.price_label" label="Price Label" outlined dense placeholder="e.g. From R150" hint="Overrides numeric price" />
            </div>
          </div>

          <!-- Image upload -->
          <div class="text-subtitle2 q-mt-sm">Product Image</div>
          <image-uploader
            :current-url="form.image_url"
            endpoint="/bz-product-image"
            @uploaded="url => form.image_url = url"
          />

          <q-toggle v-model="form.in_stock" label="In Stock" color="positive" />

          <q-card-actions align="right" class="q-pt-md">
            <q-btn flat label="Cancel" v-close-popup />
            <q-btn type="submit" color="brown-8" no-caps :label="product ? 'Update' : 'Add'" :loading="saving" />
          </q-card-actions>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useTalentStore, type Product } from 'src/stores/talent'
import ImageUploader from 'src/components/ImageUploader.vue'
import { Notify } from 'quasar'

const props = defineProps<{
  modelValue: boolean
  product: Product | null
  talentId: number
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  saved: []
}>()

const talentStore = useTalentStore()
const saving = ref(false)

const form = reactive({
  name: '',
  description: '',
  price: null as number | null,
  price_label: '',
  image_url: '',
  in_stock: true,
})

watch(() => props.modelValue, (open) => {
  if (open && props.product) {
    form.name = props.product.name
    form.description = props.product.description || ''
    form.price = props.product.price
    form.price_label = props.product.price_label || ''
    form.image_url = props.product.image_url || ''
    form.in_stock = props.product.in_stock
  } else if (open) {
    form.name = ''
    form.description = ''
    form.price = null
    form.price_label = ''
    form.image_url = ''
    form.in_stock = true
  }
})

async function handleSave() {
  saving.value = true
  try {
    await talentStore.upsertProduct({
      ...(props.product ? { id: props.product.id } : {}),
      talent_id: props.talentId,
      ...form,
    })
    Notify.create({ type: 'positive', message: props.product ? 'Product updated' : 'Product added' })
    emit('saved')
  } catch {
    Notify.create({ type: 'negative', message: 'Failed to save product' })
  } finally {
    saving.value = false
  }
}
</script>
