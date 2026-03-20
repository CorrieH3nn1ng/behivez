<template>
  <q-page class="honeycomb-bg flex flex-center" style="min-height: 80vh;">
    <q-card flat class="bee-card q-pa-xl text-center" style="max-width: 480px; width: 100%;">
      <q-icon name="check_circle" size="64px" color="positive" class="q-mb-md" />
      <h2 class="text-h5 text-weight-bold q-mb-xs">Payment Successful!</h2>

      <!-- Token purchase -->
      <template v-if="tokenCode">
        <p class="text-grey-7 q-mb-md" style="font-size: 14px;">
          Your evaluation token is ready. Use it to upload your rubric and papers.
        </p>
        <div class="q-pa-md bg-amber-1 rounded-borders q-mb-lg">
          <div class="text-caption text-grey-6 q-mb-xs">Your Token Code</div>
          <div class="text-h4 text-weight-bold text-amber-9" style="letter-spacing: 2px;">{{ tokenCode }}</div>
          <q-btn flat dense no-caps icon="content_copy" label="Copy" color="amber-8" size="sm" class="q-mt-xs" @click="copyToken" />
        </div>
        <q-btn
          class="btn-bee"
          size="lg"
          no-caps
          label="Go to Token Hub"
          :to="`/t/${tokenCode}`"
          icon="hive"
        />
        <p class="text-caption text-grey-5 q-mt-md">
          We also sent this token to your email. It's valid for 30 days.
        </p>
      </template>

      <!-- Regular payment (workspace evaluation) -->
      <template v-else>
        <p class="text-grey-7 q-mb-lg" style="font-size: 14px;">
          Your paper is being evaluated. This usually takes about 60 seconds.
        </p>
        <q-btn
          class="btn-bee"
          size="lg"
          no-caps
          label="View My Report"
          :to="processingRoute"
          icon="description"
        />
      </template>

      <p class="text-caption text-grey-5 q-mt-lg">Payment reference: {{ paymentRef }}</p>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Notify } from 'quasar'

const route = useRoute()
const paymentRef = computed(() => route.query.pf_payment_id || route.query.m_payment_id || '—')
const paperId = computed(() => route.query.paper_id || '1')
const tokenCode = computed(() => (route.query.token_code as string) || '')
const processingRoute = computed(() => `/workspace/processing/${paperId.value}`)

function copyToken() {
  navigator.clipboard.writeText(tokenCode.value).then(() => {
    Notify.create({ type: 'positive', message: 'Token code copied!' })
  })
}
</script>
