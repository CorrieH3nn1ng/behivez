<template>
  <q-card flat bordered class="q-pa-md" style="border-radius: 12px;">
    <template v-if="!submitted">
      <q-form @submit.prevent="handleSubmit" class="q-gutter-sm">
        <q-input v-model="form.visitor_name" label="Your name" outlined dense :rules="[required]" />
        <q-input v-model="form.visitor_email" label="Email" type="email" outlined dense :rules="[required, validEmail]" />
        <q-input v-model="form.visitor_phone" label="Phone (optional)" outlined dense />
        <q-input
          v-model="form.message"
          label="Message"
          type="textarea"
          outlined
          dense
          :rules="[required]"
          autogrow
        />
        <q-btn
          type="submit"
          color="brown-8"
          no-caps
          label="Send Enquiry"
          :loading="sending"
          class="full-width"
        />
      </q-form>
    </template>
    <template v-else>
      <div class="text-center q-pa-md">
        <q-icon name="check_circle" size="48px" color="positive" class="q-mb-sm" />
        <p class="text-subtitle1 text-weight-bold">Enquiry sent!</p>
        <p class="text-grey-7">{{ talentName }} will get back to you soon.</p>
        <q-btn flat no-caps label="Send another" color="brown-8" @click="reset" />
      </div>
    </template>
  </q-card>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { api } from 'src/boot/axios'
import { Notify } from 'quasar'

const props = defineProps<{
  talentId: number
  talentName: string
  preMessage?: string
}>()

const sending = ref(false)
const submitted = ref(false)

const form = reactive({
  visitor_name: '',
  visitor_email: '',
  visitor_phone: '',
  message: '',
})

// Pre-fill message from product enquiry
watch(() => props.preMessage, (msg) => {
  if (msg) form.message = msg
})

const required = (val: string) => !!val?.trim() || 'Required'
const validEmail = (val: string) => /.+@.+\..+/.test(val) || 'Invalid email'

async function handleSubmit() {
  sending.value = true
  try {
    await api.post('/bz-enquiry-submit', {
      talent_id: props.talentId,
      ...form,
    })
    submitted.value = true
  } catch {
    Notify.create({ type: 'negative', message: 'Failed to send enquiry. Please try again.' })
  } finally {
    sending.value = false
  }
}

function reset() {
  form.visitor_name = ''
  form.visitor_email = ''
  form.visitor_phone = ''
  form.message = ''
  submitted.value = false
}
</script>
