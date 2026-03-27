<template>
  <div class="math-grid">
    <div
      v-for="(q, index) in questions"
      :key="index"
      class="math-question-row"
      :class="getRowClass(index)"
    >
      <span class="question-number">{{ index + 1 }}.</span>
      <span class="question-text">{{ q.question }} =</span>
      <input
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
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

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

const inputRefs = ref<Record<number, HTMLInputElement>>({})

function getAnswer(index: number): string {
  const val = props.answers.get(index)
  return val !== undefined ? String(val) : ''
}

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
  if (!props.showResults) return ''
  if (isCorrect(index)) return 'input-correct'
  if (isWrong(index)) return 'input-wrong'
  return ''
}

onMounted(() => {
  // Focus first input
  if (inputRefs.value[0] && !props.disabled) {
    inputRefs.value[0].focus()
  }
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
@media (max-width: 500px) {
  .math-grid {
    grid-template-columns: 1fr;
  }
}
.math-question-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}
.row-answered {
  background: #fef9ee;
}
.row-correct {
  background: #dcfce7;
}
.row-wrong {
  background: #fee2e2;
}
.row-unanswered {
  background: #f3f4f6;
}
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
.result-icon {
  flex-shrink: 0;
}
</style>
