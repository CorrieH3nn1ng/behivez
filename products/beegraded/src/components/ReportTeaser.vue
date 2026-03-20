<template>
  <div class="report-teaser">
    <!-- Truncated report content -->
    <div class="teaser-content" v-html="truncatedHtml" />

    <!-- Blur overlay -->
    <div class="blur-overlay">
      <div class="blur-cta-card text-center q-pa-xl">
        <q-icon name="lock" size="48px" color="amber" class="q-mb-md" />
        <h3 class="text-h5 text-weight-bold q-mb-sm">Want the full report?</h3>
        <p class="text-grey-7 q-mb-md" style="max-width: 360px; margin: 0 auto;">
          Your full evaluation includes detailed per-question feedback, fix list,
          before/after examples, and reference audit.
        </p>
        <q-btn
          class="btn-bee"
          size="lg"
          no-caps
          label="Unlock Full Report — Buy Token R25"
          icon="hive"
          to="/buy-token"
        />
        <div class="q-mt-sm">
          <q-btn flat no-caps color="grey-6" label="Or create an account — R20/eval" to="/get-started" size="sm" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  reportHtml: string
}>()

// Server sends truncated HTML for teasers, but as extra safety
// we limit visible content on the client as well
const truncatedHtml = computed(() => {
  const html = props.reportHtml
  // If the server already truncated (contains our marker), use as-is
  if (html.includes('<!-- teaser-end -->')) {
    return html.split('<!-- teaser-end -->')[0]
  }
  // Fallback: show first ~2000 chars
  if (html.length > 2000) {
    return html.substring(0, 2000)
  }
  return html
})
</script>

<style scoped>
.report-teaser {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
}
.teaser-content {
  max-height: 600px;
  overflow: hidden;
}
.blur-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 400px;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.7) 30%,
    rgba(255, 255, 255, 0.95) 60%,
    rgba(255, 255, 255, 1) 100%
  );
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 32px;
}
.blur-cta-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  max-width: 440px;
  width: 100%;
}
</style>
