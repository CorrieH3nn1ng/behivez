<template>
  <div class="before-after-card bee-card q-mb-md">
    <div class="card-header q-pa-sm q-pl-md" style="background: #f3e5f5; border-bottom: 1px solid #e1bee7;">
      <q-icon name="auto_fix_high" color="purple" class="q-mr-sm" />
      <span class="text-weight-bold text-purple" style="font-size: 13px;">{{ title }}</span>
    </div>
    <div class="row no-wrap">
      <div class="col before-col q-pa-md">
        <div class="col-label text-orange-9">
          <q-icon name="highlight_off" size="14px" class="q-mr-xs" /> BEFORE
        </div>
        <blockquote class="example-quote before-quote">{{ before }}</blockquote>
      </div>
      <div class="col after-col q-pa-md">
        <div class="col-label text-green-8">
          <q-icon name="check_circle" size="14px" class="q-mr-xs" /> AFTER
        </div>
        <blockquote class="example-quote after-quote">{{ after }}</blockquote>
      </div>
    </div>
    <div v-if="why" class="why-section q-pa-sm q-pl-md" style="background: #f5f5f5; border-top: 1px solid #e0e0e0; font-size: 12px; color: #78716c;">
      <strong class="text-purple">Why it's better:</strong> {{ why }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  before: string
  after: string
  why?: string
}>()
</script>

<style scoped>
.before-col {
  background: #fff3e0;
  border-right: 2px solid #7b1fa2;
}
.after-col {
  background: #e8f5e9;
}
.col-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 700;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}
.example-quote {
  font-style: italic;
  margin: 0;
  padding: 10px 14px;
  background: rgba(255,255,255,0.6);
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.7;
}
.before-quote {
  border-left: 3px solid #e65100;
  color: #bf360c;
}
.after-quote {
  border-left: 3px solid #22c55e;
  color: #1b5e20;
}

@media (max-width: 600px) {
  .row.no-wrap {
    flex-wrap: wrap !important;
  }
  .before-col {
    border-right: none;
    border-bottom: 2px solid #7b1fa2;
  }
}
</style>
