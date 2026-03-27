<template>
  <div>
    <div class="math-grid">
      <div
        v-for="(q, index) in questions"
        :key="index"
        class="math-question-row"
        :class="[getRowClass(index), { 'row-active': isMobile && activeIndex === index && !disabled }]"
        @click="isMobile ? selectQuestion(index) : undefined"
      >
        <span class="question-number">{{ index + 1 }}.</span>
        <span class="question-text">{{ q.question }} =</span>

        <!-- Desktop: regular input -->
        <input
          v-if="!isMobile"
          :ref="el => { if (el) inputRefs[index] = el as HTMLInputElement }"
          type="number"
          class="answer-input"
          :class="getInputClass(index)"
          :value="getAnswer(index)"
          :disabled="disabled"
          :placeholder="disabled ? '—' : '?'"
          @input="onInput(index, $event)"
          @keydown.enter="focusNext(index)"
          @keydown.tab.prevent="focusNext(index)"
        />

        <!-- Mobile: tap-to-select display -->
        <span
          v-else
          class="answer-display"
          :class="getInputClass(index)"
        >
          {{ getAnswer(index) || (disabled ? '—' : '?') }}
        </span>

        <span v-if="showResults && isWrong(index)" class="correct-badge">
          {{ getCorrectAnswer(index) }}
        </span>
        <q-icon
          v-if="showResults && isCorrect(index)"
          name="check_circle"
          color="positive"
          size="20px"
          class="result-icon"
        />
        <q-icon
          v-if="showResults && isWrong(index)"
          name="cancel"
          color="negative"
          size="20px"
          class="result-icon"
        />
      </div>
    </div>

    <!-- Compact Number Pad (mobile only) — teleported to body to avoid overflow clipping -->
    <Teleport to="body">
    <div v-if="isMobile && !disabled && !showResults" class="numpad-container">
      <div class="numpad-question">
        <span class="text-weight-bold">{{ activeIndex + 1 }}.</span>
        {{ questions[activeIndex]?.question }} =
        <span class="numpad-answer">{{ currentInput || '?' }}</span>
      </div>
      <div class="numpad-strip">
        <div v-for="n in [1,2,3,4,5,6,7,8,9,0]" :key="n" class="numpad-key" @touchstart.prevent="tapDigit(n)" @mousedown.prevent="tapDigit(n)">{{ n }}</div>
        <div class="numpad-key numpad-clear" @touchstart.prevent="tapClear" @mousedown.prevent="tapClear">C</div>
        <div class="numpad-key numpad-next" @touchstart.prevent="tapNext" @mousedown.prevent="tapNext">&rarr;</div>
      </div>
    </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'

interface Question {
  question: string
  operation: string
}

interface MarkedAnswer {
  questionIndex: number
  givenAnswer: number
  correctAnswer?: number
  correct?: boolean
}

const props = defineProps<{
  questions: Question[]
  answers: Map<number, number>
  disabled?: boolean
  showResults?: boolean
  markedAnswers?: MarkedAnswer[]
}>()

const emit = defineEmits<{
  answer: [index: number, value: number]
}>()

// Detect mobile — always show numpad on narrow screens OR touch devices
const isMobile = ref(false)
function checkMobile() {
  if (typeof window !== 'undefined') {
    isMobile.value = window.innerWidth <= 900 || 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }
}
checkMobile()

// Desktop input refs
const inputRefs = ref<Record<number, HTMLInputElement>>({})

// Mobile numpad state
const activeIndex = ref(0)
const currentInput = ref('')

// Desktop input handler
function onInput(index: number, event: Event) {
  const input = event.target as HTMLInputElement
  const val = input.value.trim()
  if (val !== '' && !isNaN(Number(val))) {
    emit('answer', index, Number(val))
  }
}

function focusNext(index: number) {
  const next = index + 1
  if (next < props.questions.length && inputRefs.value[next]) {
    inputRefs.value[next].focus()
  }
}

// Mobile numpad handlers
function selectQuestion(index: number) {
  if (props.disabled) return
  activeIndex.value = index
  const existing = props.answers.get(index)
  currentInput.value = existing !== undefined ? String(existing) : ''
}

function tapDigit(n: number) {
  if (activeIndex.value < 0) return
  if (currentInput.value.length >= 4) return
  currentInput.value += String(n)
  emit('answer', activeIndex.value, Number(currentInput.value))
}

function tapClear() {
  currentInput.value = ''
}

function tapNext() {
  const total = props.questions.length
  for (let i = 0; i < total; i++) {
    const idx = (activeIndex.value + 1 + i) % total
    if (!props.answers.has(idx)) {
      selectQuestion(idx)
      return
    }
  }
  selectQuestion((activeIndex.value + 1) % total)
}

watch(activeIndex, (idx) => {
  const existing = props.answers.get(idx)
  currentInput.value = existing !== undefined ? String(existing) : ''
})

function getAnswer(index: number): string {
  const val = props.answers.get(index)
  return val !== undefined ? String(val) : ''
}

function getMarked(index: number): MarkedAnswer | undefined {
  return props.markedAnswers?.find(a => a.questionIndex === index)
}

function isCorrect(index: number): boolean {
  return getMarked(index)?.correct === true
}

function isWrong(index: number): boolean {
  const m = getMarked(index)
  return m ? m.correct === false : false
}

function getCorrectAnswer(index: number): string {
  const m = getMarked(index)
  return m?.correctAnswer !== undefined ? String(m.correctAnswer) : ''
}

function getRowClass(index: number): string {
  if (!props.showResults) {
    return props.answers.has(index) ? 'row-answered' : ''
  }
  if (isCorrect(index)) return 'row-correct'
  if (isWrong(index)) return 'row-wrong'
  return 'row-unanswered'
}

function getInputClass(index: number): string {
  if (!props.showResults) {
    if (isMobile.value && activeIndex.value === index) return 'answer-active'
    return props.answers.has(index) ? 'answer-filled' : ''
  }
  if (isCorrect(index)) return 'input-correct'
  if (isWrong(index)) return 'input-wrong'
  return ''
}

onMounted(() => {
  checkMobile()
  if (!isMobile.value && inputRefs.value[0] && !props.disabled) {
    inputRefs.value[0].focus()
  }
  activeIndex.value = 0
  currentInput.value = ''
})
</script>

<style scoped>
.math-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 24px;
  max-width: 700px;
  margin: 0 auto;
}
@media (max-width: 768px) {
  .math-grid {
    grid-template-columns: 1fr;
    padding-bottom: 80px;
  }
}
.math-question-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
@media (max-width: 768px) {
  .math-question-row { cursor: pointer; }
}
.row-answered { background: #fef9ee; }
.row-active {
  background: #fef3c7 !important;
  border: 2px solid #f59e0b;
  padding: 4px 6px;
}
.row-correct { background: #dcfce7; }
.row-wrong { background: #fee2e2; }
.row-unanswered { background: #f3f4f6; }
.question-number {
  min-width: 28px;
  text-align: right;
  font-weight: 600;
  color: #78350f;
  font-size: 14px;
}
.question-text {
  flex: 1;
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;
}

/* Desktop input */
.answer-input {
  width: 60px;
  padding: 4px 8px;
  border: 2px solid #d1d5db;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  outline: none;
  transition: border-color 0.2s;
  -moz-appearance: textfield;
}
.answer-input::-webkit-inner-spin-button,
.answer-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.answer-input:focus {
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
}

/* Mobile answer display */
.answer-display {
  min-width: 50px;
  padding: 4px 8px;
  border: 2px solid #d1d5db;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  background: white;
}
.answer-active {
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
  background: #fffbeb;
}
.answer-filled {
  border-color: #a3a3a3;
  color: #1c1917;
}

/* Shared result styles */
.input-correct {
  border-color: #16a34a;
  background: #f0fdf4;
}
.input-wrong {
  border-color: #dc2626;
  background: #fef2f2;
}
.correct-badge {
  font-size: 12px;
  color: #16a34a;
  font-weight: 600;
}
.result-icon { flex-shrink: 0; }
</style>

<!-- Unscoped styles for teleported numpad -->
<style>
.numpad-container {
  position: fixed !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
  background: #1c1917;
  padding: 4px 4px env(safe-area-inset-bottom, 4px);
  z-index: 9999;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.3);
}
.numpad-question {
  text-align: center;
  color: #d1d5db;
  font-size: 13px;
  padding: 2px 0;
}
.numpad-answer {
  color: #f59e0b;
  font-weight: 700;
  font-size: 16px;
}
.numpad-strip {
  display: flex;
  gap: 3px;
  padding: 2px 0;
}
.numpad-key {
  flex: 1;
  background: #374151;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 18px;
  font-weight: 600;
  padding: 10px 0;
  text-align: center;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.numpad-key:active {
  background: #f59e0b;
  color: #1c1917;
}
.numpad-clear { background: #7f1d1d; }
.numpad-clear:active { background: #dc2626; }
.numpad-next { background: #14532d; }
.numpad-next:active { background: #16a34a; }
</style>
