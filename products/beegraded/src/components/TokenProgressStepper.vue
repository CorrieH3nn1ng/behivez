<template>
  <div class="token-stepper q-mb-lg">
    <div class="row items-center justify-center q-gutter-sm">
      <template v-for="(step, idx) in steps" :key="step.key">
        <!-- Step circle -->
        <div class="text-center" style="min-width: 80px;">
          <div
            class="step-circle q-mx-auto q-mb-xs"
            :class="{
              'step-done': currentStep > idx + 1,
              'step-active': currentStep === idx + 1,
              'step-pending': currentStep < idx + 1,
            }"
          >
            <q-icon v-if="currentStep > idx + 1" name="check" size="20px" color="white" />
            <span v-else>{{ idx + 1 }}</span>
          </div>
          <div class="text-caption" :class="currentStep >= idx + 1 ? 'text-amber-8 text-weight-bold' : 'text-grey-5'">
            {{ step.label }}
          </div>
        </div>
        <!-- Connector line -->
        <div v-if="idx < steps.length - 1" class="step-connector" :class="currentStep > idx + 1 ? 'connector-done' : 'connector-pending'" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  currentStep: number
}>()

const steps = [
  { key: 'rubric', label: 'Rubric' },
  { key: 'draft', label: 'Draft' },
  { key: 'final', label: 'Final' },
]
</script>

<style scoped>
.step-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  transition: all 0.3s;
}
.step-done {
  background: #f59e0b;
  color: white;
}
.step-active {
  background: white;
  border: 3px solid #f59e0b;
  color: #f59e0b;
}
.step-pending {
  background: #e5e7eb;
  color: #9ca3af;
}
.step-connector {
  height: 3px;
  width: 60px;
  border-radius: 2px;
  margin-bottom: 20px;
}
.connector-done {
  background: #f59e0b;
}
.connector-pending {
  background: #e5e7eb;
}
</style>
