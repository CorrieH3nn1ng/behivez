<template>
  <div class="strengths-list">
    <div class="severity-header q-pa-sm q-pl-md q-mb-sm bg-positive">
      <q-icon name="emoji_events" color="white" size="18px" class="q-mr-sm" />
      <span class="text-white text-weight-bold" style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
        What You Did Well ({{ strengths.length }})
      </span>
    </div>

    <q-list bordered separator class="rounded-borders">
      <q-expansion-item
        v-for="item in strengths"
        :key="item.id"
        expand-separator
      >
        <template #header>
          <q-item-section avatar>
            <q-icon name="check_circle" color="positive" size="24px" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bold text-positive" style="font-size: 14px;">{{ item.category }}</q-item-label>
            <q-item-label caption>{{ item.what_well }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-badge v-if="item.who_notices" outline color="green-7" :label="item.who_notices" />
          </q-item-section>
        </template>

        <!-- Positive 5W1H Expanded Detail -->
        <q-card flat class="q-ma-sm" style="background: #f0fdf4; border-radius: 8px;">
          <q-card-section class="q-pa-md">
            <!-- WHERE -->
            <div v-if="item.where_in_paper" class="detail-row q-mb-sm">
              <span class="detail-tag bg-green-1 text-green-8">WHERE</span>
              <span class="detail-text">{{ item.where_in_paper }}</span>
            </div>

            <!-- WHY chain (positive drill-down) -->
            <div v-if="item.why_chain && item.why_chain.length" class="detail-row q-mb-sm">
              <span class="detail-tag bg-green-2 text-green-9">WHY IT WORKS</span>
              <div class="why-chain">
                <div v-for="(why, i) in item.why_chain" :key="i" class="why-step">
                  <span class="why-num">{{ i + 1 }}</span>
                  <span class="why-text">{{ why }}</span>
                  <q-icon v-if="i < item.why_chain.length - 1" name="arrow_downward" size="14px" color="green-6" class="why-arrow" />
                </div>
              </div>
            </div>

            <!-- REUSABLE PATTERN (highlighted) -->
            <div v-if="item.reusable_pattern" class="reusable-pattern q-mb-sm q-pa-sm" style="background: #dcfce7; border-left: 3px solid #22c55e; border-radius: 4px;">
              <span class="detail-tag bg-positive text-white">KEEP DOING THIS</span>
              <span class="detail-text text-weight-bold">{{ item.reusable_pattern }}</span>
            </div>

            <!-- HOW IT HELPS -->
            <div v-if="item.how_it_helps" class="detail-row">
              <span class="detail-tag bg-blue-1 text-blue-8">BOOSTS</span>
              <span class="detail-text">{{ item.how_it_helps }}</span>
            </div>
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </q-list>
  </div>
</template>

<script setup lang="ts">
interface Strength {
  id: number
  category: string
  what_well: string
  where_in_paper: string | null
  why_chain: string[] | null
  reusable_pattern: string | null
  how_it_helps: string | null
  who_notices: string | null
}

defineProps<{
  strengths: Strength[]
}>()
</script>

<style scoped>
.severity-header {
  border-radius: 8px;
  display: flex;
  align-items: center;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
}

.detail-tag {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  flex-shrink: 0;
  margin-top: 2px;
}

.detail-text {
  line-height: 1.5;
}

.why-chain {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.why-step {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 4px 0;
}

.why-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #22c55e;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
}

.why-text {
  font-size: 13px;
  line-height: 1.5;
}

.why-arrow {
  margin-left: 4px;
  margin-top: 2px;
}

.reusable-pattern {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
}
</style>
