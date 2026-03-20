<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="min-width: 400px;">
      <q-card-section class="text-h6">
        {{ service ? 'Edit Service' : 'Add Service' }}
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="handleSave" class="q-gutter-sm">
          <q-input v-model="form.name" label="Service Name" outlined dense :rules="[v => !!v || 'Required']" />
          <q-input v-model="form.description" label="Description" type="textarea" outlined dense autogrow />
          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <q-input v-model.number="form.price" label="Price (R)" type="number" outlined dense hint="Exact price in Rands" />
            </div>
            <div class="col-6">
              <q-input v-model="form.price_label" label="Price Label" outlined dense placeholder="e.g. From R500, Free, POA" hint="Shows instead of price if set" />
            </div>
          </div>
          <q-input v-model="form.duration" label="Duration" outlined dense placeholder="e.g. 1 hour, Per session, Once-off" hint="How long or how often" />

          <q-card-actions align="right" class="q-pt-md">
            <q-btn flat label="Cancel" v-close-popup />
            <q-btn type="submit" color="brown-8" no-caps :label="service ? 'Update' : 'Add'" :loading="saving" />
          </q-card-actions>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { api } from 'src/boot/axios'
import { Notify } from 'quasar'
import type { Service } from 'src/stores/talent'

const props = defineProps<{
  modelValue: boolean
  service: Service | null
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  saved: []
}>()

const saving = ref(false)

const form = reactive({
  name: '',
  description: '',
  price: null as number | null,
  price_label: '',
  duration: '',
})

watch(() => props.modelValue, (open) => {
  if (open && props.service) {
    form.name = props.service.name
    form.description = props.service.description || ''
    form.price = props.service.price
    form.price_label = props.service.price_label || ''
    form.duration = props.service.duration || ''
  } else if (open) {
    form.name = ''
    form.description = ''
    form.price = null
    form.price_label = ''
    form.duration = ''
  }
})

async function handleSave() {
  saving.value = true
  try {
    const endpoint = props.service ? '/bz-service-update' : '/bz-service-create'
    const payload = props.service ? { id: props.service.id, ...form } : { ...form }
    await api.post(endpoint, payload)
    Notify.create({ type: 'positive', message: props.service ? 'Service updated' : 'Service added' })
    emit('saved')
  } catch {
    Notify.create({ type: 'negative', message: 'Failed to save service' })
  } finally {
    saving.value = false
  }
}
</script>
