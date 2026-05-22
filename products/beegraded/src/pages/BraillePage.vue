<template>
  <q-page class="honeycomb-bg">
    <div class="page-container" style="max-width: 580px;">
      <q-btn flat dense no-caps icon="arrow_back" label="Back" color="amber-8" class="q-mb-md" to="/workspace/account" />

      <div class="text-center q-mb-lg">
        <div style="font-size: 52px; letter-spacing: 8px; color: #78350f; line-height: 1;">⠃⠗⠇</div>
        <h2 class="text-h5 text-weight-bold q-mb-none" style="color: #78350f;">Braille</h2>
        <div class="text-caption text-grey-6">
          {{ lang === 'af' ? 'Leer om Braille te lees — elke letter, syfer en leesteken' : 'Learn to read Braille — every letter, number and punctuation mark' }}
        </div>
      </div>

      <!-- Setup: choose lesson group -->
      <template v-if="phase === 'setup'">
        <q-card flat class="bee-card q-pa-lg q-mb-md">
          <div class="text-subtitle2 text-weight-bold q-mb-xs" style="color: #78350f;">
            {{ lang === 'af' ? 'Wat wil jy leer?' : 'What would you like to learn?' }}
          </div>
          <div class="text-caption text-grey-6 q-mb-md">
            {{ lang === 'af'
              ? 'Elke les het flitskaarte plus \'n toets. Elke Braille-sel het 6 punte in \'n 2×3-rooster.'
              : 'Each lesson has flashcards plus a quiz. Every Braille cell has 6 dots in a 2×3 grid.' }}
          </div>

          <q-list separator>
            <q-item v-for="lesson in lessons" :key="lesson.id" clickable
              :active="selectedLesson === lesson.id" active-color="amber-8"
              @click="selectedLesson = lesson.id"
              class="rounded-borders q-mb-xs"
              style="border: 1px solid #f0ebe0; border-radius: 8px;">
              <q-item-section avatar>
                <div style="font-size: 22px; width: 40px; text-align: center;">{{ lesson.preview }}</div>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">{{ lang === 'af' ? lesson.label_af : lesson.label_en }}</q-item-label>
                <q-item-label caption>{{ lang === 'af' ? lesson.desc_af : lesson.desc_en }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge color="grey-5">{{ lesson.cards.length }}</q-badge>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <q-card flat class="bee-card q-pa-md q-mb-md">
          <div class="text-caption text-grey-7 q-mb-sm text-weight-bold">
            {{ lang === 'af' ? 'Hoe Braille-selle werk:' : 'How Braille cells work:' }}
          </div>
          <div class="row items-center q-gutter-md">
            <div class="braille-grid">
              <div v-for="(d, i) in [true,false,true,false,false,true]" :key="i"
                class="dot-demo" :class="{ raised: d }">{{ [1,2,3,4,5,6][i] }}</div>
            </div>
            <div class="text-caption text-grey-6" style="flex: 1;">
              {{ lang === 'af'
                ? '6 punte in 2 kolomme, 3 rye. Kolom links: punte 1,2,3. Kolom regs: punte 4,5,6. Geel = verhoog.'
                : '6 dots in 2 columns, 3 rows. Left column: dots 1,2,3. Right column: dots 4,5,6. Amber = raised.' }}
            </div>
          </div>
        </q-card>

        <q-btn class="btn-bee full-width" size="lg" no-caps icon="play_arrow"
          :label="lang === 'af' ? 'Begin Les' : 'Start Lesson'"
          :disable="!selectedLesson"
          @click="startLesson" />
      </template>

      <!-- Learn: flashcards -->
      <template v-if="phase === 'learn' && currentCards.length">
        <div class="text-center q-mb-sm">
          <q-badge color="amber" class="q-pa-xs">{{ currentIndex + 1 }} / {{ currentCards.length }}</q-badge>
          <q-badge color="grey-5" class="q-pa-xs q-ml-sm">{{ lang === 'af' ? activeLessonLabel.label_af : activeLessonLabel.label_en }}</q-badge>
        </div>

        <q-card flat class="bee-card q-pa-xl q-mb-md text-center cursor-pointer"
          style="min-height: 280px; display: flex; flex-direction: column; justify-content: center;"
          @click="flipped = !flipped">
          <template v-if="!flipped">
            <!-- Front: Braille character + dot visualiser -->
            <div style="font-size: 80px; line-height: 1; margin-bottom: 8px; font-family: 'Segoe UI Symbol', 'Noto Sans Symbols2', sans-serif;">
              {{ card.braille }}
            </div>
            <div class="flex flex-center q-mb-sm">
              <div class="braille-grid">
                <div v-for="(raised, i) in dotsForChar(card.braille)" :key="i"
                  class="dot-demo" :class="{ raised }">{{ [1,2,3,4,5,6][i] }}</div>
              </div>
            </div>
            <div class="text-caption text-grey-5">
              {{ lang === 'af' ? 'Aktiewe punte: ' : 'Active dots: ' }}
              <b>{{ activeDotNumbers(card.braille) }}</b>
            </div>
            <div class="text-caption text-grey-4 q-mt-sm">{{ lang === 'af' ? 'tik om te onthul' : 'tap to reveal' }}</div>
          </template>

          <template v-else>
            <!-- Back: answer + description -->
            <div class="text-h2 text-weight-bold text-amber-8 q-mb-sm">
              {{ card.label }}
            </div>
            <div class="text-caption text-grey-6 q-mb-md">
              {{ lang === 'af' ? card.desc_af : card.desc_en }}
            </div>
            <div v-if="card.note_en" class="q-pa-sm" style="background: #fef9ee; border-radius: 8px;">
              <div class="text-caption" style="color: #555;">
                {{ lang === 'af' ? card.note_af : card.note_en }}
              </div>
            </div>
            <div class="flex flex-center q-mt-md">
              <div class="braille-grid">
                <div v-for="(raised, i) in dotsForChar(card.braille)" :key="i"
                  class="dot-demo" :class="{ raised }">{{ [1,2,3,4,5,6][i] }}</div>
              </div>
            </div>
          </template>
        </q-card>

        <div class="row q-gutter-sm justify-center">
          <q-btn outline color="grey" icon="arrow_back" :disable="currentIndex === 0" @click="prev" no-caps :label="lang === 'af' ? 'Vorige' : 'Previous'" />
          <q-btn v-if="currentIndex < currentCards.length - 1" class="btn-bee" icon-right="arrow_forward" @click="next" no-caps :label="lang === 'af' ? 'Volgende' : 'Next'" />
          <q-btn v-else class="btn-bee" icon="quiz" @click="startQuiz" no-caps :label="lang === 'af' ? 'Neem Toets' : 'Take Quiz'" />
        </div>

        <div class="text-center q-mt-md">
          <span v-for="(_, i) in currentCards" :key="i" class="q-mx-xs" :style="{
            display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%',
            background: i === currentIndex ? '#f59e0b' : i < currentIndex ? '#16a34a' : '#d1d5db',
          }" />
        </div>
      </template>

      <!-- Quiz -->
      <template v-if="phase === 'quiz'">
        <div class="text-center q-mb-md">
          <q-badge color="green">{{ lang === 'af' ? 'Vraag' : 'Question' }} {{ quizIndex + 1 }} / {{ currentCards.length }}</q-badge>
        </div>

        <q-card flat class="bee-card q-pa-lg q-mb-md">
          <div class="text-center q-mb-lg">
            <div class="text-caption text-grey-5 q-mb-sm">{{ lang === 'af' ? 'Watter letter/syfer is dit?' : 'Which letter or number is this?' }}</div>
            <div style="font-size: 72px; line-height: 1; font-family: 'Segoe UI Symbol', 'Noto Sans Symbols2', sans-serif;" class="q-mb-sm">
              {{ quizCard.braille }}
            </div>
            <div class="flex flex-center q-mb-xs">
              <div class="braille-grid">
                <div v-for="(raised, i) in dotsForChar(quizCard.braille)" :key="i"
                  class="dot-demo" :class="{ raised }">{{ [1,2,3,4,5,6][i] }}</div>
              </div>
            </div>
            <div class="text-caption text-grey-5">
              {{ lang === 'af' ? 'Punte: ' : 'Dots: ' }}<b>{{ activeDotNumbers(quizCard.braille) }}</b>
            </div>
          </div>

          <div class="row q-col-gutter-sm">
            <div v-for="(opt, i) in quizOptions" :key="i" class="col-6">
              <q-btn :outline="quizAnswer !== i" no-caps class="full-width"
                style="font-size: 20px; font-weight: bold; padding: 16px;"
                :color="quizAnswered ? (opt.label === quizCard.label ? 'positive' : quizAnswer === i ? 'negative' : 'grey') : 'amber-8'"
                :disable="quizAnswered"
                @click="answer(i, opt.label)">
                {{ opt.label }}
              </q-btn>
            </div>
          </div>

          <div v-if="quizAnswered" class="text-center q-mt-md">
            <div v-if="quizCorrect" class="text-positive text-weight-bold">
              <q-icon name="check_circle" /> {{ lang === 'af' ? 'Korrek!' : 'Correct!' }}
            </div>
            <div v-else class="text-negative">
              <q-icon name="cancel" /> {{ lang === 'af' ? 'Die antwoord is' : 'The answer is' }} <b>{{ quizCard.label }}</b>
            </div>
            <div class="text-caption text-grey-6 q-mt-xs">{{ lang === 'af' ? quizCard.desc_af : quizCard.desc_en }}</div>
            <q-btn class="btn-bee q-mt-md" no-caps
              :label="quizIndex < currentCards.length - 1 ? (lang === 'af' ? 'Volgende' : 'Next') : (lang === 'af' ? 'Sien Punte' : 'See Score')"
              @click="nextQuestion" />
          </div>
        </q-card>
      </template>

      <!-- Results -->
      <template v-if="phase === 'results'">
        <q-card flat class="bee-card q-pa-xl q-mb-md text-center">
          <q-icon :name="score >= currentCards.length * 0.8 ? 'emoji_events' : score >= currentCards.length * 0.5 ? 'thumb_up' : 'fitness_center'"
            size="64px" :color="score >= currentCards.length * 0.8 ? 'amber' : score >= currentCards.length * 0.5 ? 'green' : 'grey'" />
          <div class="text-h4 text-weight-bold q-mt-md" style="color: #78350f;">{{ score }} / {{ currentCards.length }}</div>
          <div class="text-subtitle1 text-grey-7 q-mt-sm">
            {{ score === currentCards.length ? (lang === 'af' ? 'Perfek! Jy ken hierdie groep!' : 'Perfect! You know this group!')
              : score >= currentCards.length * 0.8 ? (lang === 'af' ? 'Uitstekend! Byna perfek.' : 'Excellent! Nearly perfect.')
              : score >= currentCards.length * 0.5 ? (lang === 'af' ? 'Goeie poging! Oefen meer.' : 'Good effort! Practise some more.')
              : (lang === 'af' ? 'Hersien die flitskaarte en probeer weer.' : 'Review the flashcards and try again.') }}
          </div>
        </q-card>

        <div class="row q-gutter-sm justify-center q-mb-md">
          <q-btn outline color="amber-8" icon="replay" :label="lang === 'af' ? 'Studeer Weer' : 'Study Again'" no-caps @click="restartLearn" />
          <q-btn class="btn-bee" icon="list" :label="lang === 'af' ? 'Kies Les' : 'Choose Lesson'" no-caps @click="backToSetup" />
        </div>

        <!-- Reference card -->
        <q-card flat class="bee-card q-pa-md">
          <div class="text-weight-bold q-mb-md">{{ lang === 'af' ? 'Hierdie les — naslaankaart:' : 'This lesson — reference card:' }}</div>
          <div class="row q-col-gutter-sm">
            <div v-for="c in currentCards" :key="c.label" class="col-4 col-sm-3 text-center">
              <div style="font-size: 32px; font-family: 'Segoe UI Symbol', 'Noto Sans Symbols2', sans-serif;">{{ c.braille }}</div>
              <div class="text-weight-bold" style="font-size: 18px; color: #78350f;">{{ c.label }}</div>
              <div class="text-caption text-grey-5">{{ lang === 'af' ? `Punte ${activeDotNumbers(c.braille)}` : `Dots ${activeDotNumbers(c.braille)}` }}</div>
            </div>
          </div>
        </q-card>
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'src/i18n'

const { lang } = useI18n()

// ─── Braille data (Grade 1 English Braille — 100% hardcoded, no AI) ─────────

interface BrailleCard {
  braille: string
  label: string
  desc_en: string
  desc_af: string
  note_en?: string
  note_af?: string
}

function cell(dots: number[]): string {
  let code = 0
  for (const d of dots) {
    code |= [1, 2, 4, 8, 16, 32][d - 1]!
  }
  return String.fromCodePoint(0x2800 + code)
}

const ALPHABET: BrailleCard[] = [
  { braille: cell([1]),         label: 'A', desc_en: 'Dot 1 — top-left only',                   desc_af: 'Punt 1 — bo-links alleen' },
  { braille: cell([1,2]),       label: 'B', desc_en: 'Dots 1, 2 — top two on left',              desc_af: 'Punte 1, 2 — bo twee aan links' },
  { braille: cell([1,4]),       label: 'C', desc_en: 'Dots 1, 4 — top row',                      desc_af: 'Punte 1, 4 — bo-ry' },
  { braille: cell([1,4,5]),     label: 'D', desc_en: 'Dots 1, 4, 5 — top row + middle-right',    desc_af: 'Punte 1, 4, 5 — bo-ry + middel-regs' },
  { braille: cell([1,5]),       label: 'E', desc_en: 'Dots 1, 5 — top-left, middle-right',       desc_af: 'Punte 1, 5 — bo-links, middel-regs' },
  { braille: cell([1,2,4]),     label: 'F', desc_en: 'Dots 1, 2, 4 — top-left L-shape',         desc_af: 'Punte 1, 2, 4 — links-bo L-vorm' },
  { braille: cell([1,2,4,5]),   label: 'G', desc_en: 'Dots 1, 2, 4, 5 — top 2×2 square',        desc_af: 'Punte 1, 2, 4, 5 — bo 2×2 blok' },
  { braille: cell([1,2,5]),     label: 'H', desc_en: 'Dots 1, 2, 5',                             desc_af: 'Punte 1, 2, 5' },
  { braille: cell([2,4]),       label: 'I', desc_en: 'Dots 2, 4 — middle row',                   desc_af: 'Punte 2, 4 — middelry' },
  { braille: cell([2,4,5]),     label: 'J', desc_en: 'Dots 2, 4, 5',                             desc_af: 'Punte 2, 4, 5' },
  { braille: cell([1,3]),       label: 'K', desc_en: 'Dots 1, 3 — full left column top/bottom',  desc_af: 'Punte 1, 3 — linkerkolom bo/onder' },
  { braille: cell([1,2,3]),     label: 'L', desc_en: 'Dots 1, 2, 3 — full left column',          desc_af: 'Punte 1, 2, 3 — volle linkerkolom' },
  { braille: cell([1,3,4]),     label: 'M', desc_en: 'Dots 1, 3, 4',                             desc_af: 'Punte 1, 3, 4' },
  { braille: cell([1,3,4,5]),   label: 'N', desc_en: 'Dots 1, 3, 4, 5',                          desc_af: 'Punte 1, 3, 4, 5' },
  { braille: cell([1,3,5]),     label: 'O', desc_en: 'Dots 1, 3, 5',                             desc_af: 'Punte 1, 3, 5' },
  { braille: cell([1,2,3,4]),   label: 'P', desc_en: 'Dots 1, 2, 3, 4',                          desc_af: 'Punte 1, 2, 3, 4' },
  { braille: cell([1,2,3,4,5]), label: 'Q', desc_en: 'Dots 1, 2, 3, 4, 5',                       desc_af: 'Punte 1, 2, 3, 4, 5' },
  { braille: cell([1,2,3,5]),   label: 'R', desc_en: 'Dots 1, 2, 3, 5',                          desc_af: 'Punte 1, 2, 3, 5' },
  { braille: cell([2,3,4]),     label: 'S', desc_en: 'Dots 2, 3, 4',                             desc_af: 'Punte 2, 3, 4' },
  { braille: cell([2,3,4,5]),   label: 'T', desc_en: 'Dots 2, 3, 4, 5',                          desc_af: 'Punte 2, 3, 4, 5' },
  { braille: cell([1,3,6]),     label: 'U', desc_en: 'Dots 1, 3, 6 — K + dot 6',                desc_af: 'Punte 1, 3, 6 — K + punt 6' },
  { braille: cell([1,2,3,6]),   label: 'V', desc_en: 'Dots 1, 2, 3, 6 — L + dot 6',             desc_af: 'Punte 1, 2, 3, 6 — L + punt 6' },
  { braille: cell([2,4,5,6]),   label: 'W', desc_en: 'Dots 2, 4, 5, 6 — J + dot 6',             desc_af: 'Punte 2, 4, 5, 6 — J + punt 6' },
  { braille: cell([1,3,4,6]),   label: 'X', desc_en: 'Dots 1, 3, 4, 6 — M + dot 6',             desc_af: 'Punte 1, 3, 4, 6 — M + punt 6' },
  { braille: cell([1,3,4,5,6]), label: 'Y', desc_en: 'Dots 1, 3, 4, 5, 6 — N + dot 6',          desc_af: 'Punte 1, 3, 4, 5, 6 — N + punt 6' },
  { braille: cell([1,3,5,6]),   label: 'Z', desc_en: 'Dots 1, 3, 5, 6 — O + dot 6',             desc_af: 'Punte 1, 3, 5, 6 — O + punt 6' },
]

const NUMBER_INDICATOR: BrailleCard = {
  braille: cell([3,4,5,6]),
  label: '⠼',
  desc_en: 'Dots 3, 4, 5, 6 — Number indicator',
  desc_af: 'Punte 3, 4, 5, 6 — Getalteken',
  note_en: 'This symbol always comes before numbers to tell the reader "what follows are digits, not letters".',
  note_af: 'Hierdie simbool kom altyd voor syfers om aan te dui "wat volg is syfers, nie letters nie".',
}

const NUMBERS: BrailleCard[] = [
  NUMBER_INDICATOR,
  { braille: cell([1]),       label: '1', desc_en: 'Dot 1 — same cell as A',       desc_af: 'Punt 1 — selfde sel as A',       note_en: 'Same dots as A. Write the number indicator ⠼ first.', note_af: 'Selfde punte as A. Skryf die getalteken ⠼ eerste.' },
  { braille: cell([1,2]),     label: '2', desc_en: 'Dots 1, 2 — same cell as B',   desc_af: 'Punte 1, 2 — selfde sel as B',   note_en: 'Same dots as B. Write the number indicator ⠼ first.', note_af: 'Selfde punte as B. Skryf die getalteken ⠼ eerste.' },
  { braille: cell([1,4]),     label: '3', desc_en: 'Dots 1, 4 — same cell as C',   desc_af: 'Punte 1, 4 — selfde sel as C',   note_en: 'Same dots as C. Write the number indicator ⠼ first.', note_af: 'Selfde punte as C. Skryf die getalteken ⠼ eerste.' },
  { braille: cell([1,4,5]),   label: '4', desc_en: 'Dots 1, 4, 5 — same cell as D', desc_af: 'Punte 1, 4, 5 — selfde sel as D', note_en: 'Same dots as D.', note_af: 'Selfde punte as D.' },
  { braille: cell([1,5]),     label: '5', desc_en: 'Dots 1, 5 — same cell as E',   desc_af: 'Punte 1, 5 — selfde sel as E',   note_en: 'Same dots as E.', note_af: 'Selfde punte as E.' },
  { braille: cell([1,2,4]),   label: '6', desc_en: 'Dots 1, 2, 4 — same cell as F', desc_af: 'Punte 1, 2, 4 — selfde sel as F', note_en: 'Same dots as F.', note_af: 'Selfde punte as F.' },
  { braille: cell([1,2,4,5]), label: '7', desc_en: 'Dots 1, 2, 4, 5 — same cell as G', desc_af: 'Punte 1, 2, 4, 5 — selfde sel as G', note_en: 'Same dots as G.', note_af: 'Selfde punte as G.' },
  { braille: cell([1,2,5]),   label: '8', desc_en: 'Dots 1, 2, 5 — same cell as H', desc_af: 'Punte 1, 2, 5 — selfde sel as H', note_en: 'Same dots as H.', note_af: 'Selfde punte as H.' },
  { braille: cell([2,4]),     label: '9', desc_en: 'Dots 2, 4 — same cell as I',   desc_af: 'Punte 2, 4 — selfde sel as I',   note_en: 'Same dots as I.', note_af: 'Selfde punte as I.' },
  { braille: cell([2,4,5]),   label: '0', desc_en: 'Dots 2, 4, 5 — same cell as J', desc_af: 'Punte 2, 4, 5 — selfde sel as J', note_en: 'Same dots as J.', note_af: 'Selfde punte as J.' },
]

const PUNCTUATION: BrailleCard[] = [
  { braille: cell([2,5,6]),   label: '.', desc_en: 'Dots 2, 5, 6 — Full stop / period', desc_af: 'Punte 2, 5, 6 — Punt' },
  { braille: cell([2]),       label: ',', desc_en: 'Dot 2 — Comma',                     desc_af: 'Punt 2 — Komma' },
  { braille: cell([2,3,6]),   label: '?', desc_en: 'Dots 2, 3, 6 — Question mark',      desc_af: 'Punte 2, 3, 6 — Vraagteken' },
  { braille: cell([2,3,5]),   label: '!', desc_en: 'Dots 2, 3, 5 — Exclamation mark',   desc_af: 'Punte 2, 3, 5 — Uitroepteken' },
  { braille: cell([3,6]),     label: '-', desc_en: 'Dots 3, 6 — Hyphen',                desc_af: 'Punte 3, 6 — Koppelteken' },
  { braille: cell([3,5,6]),   label: '"', desc_en: 'Dots 3, 5, 6 — Closing quote',      desc_af: 'Punte 3, 5, 6 — Sluitende aanhalingsteken' },
]

const lessons = [
  { id: 'a-j',    label_en: 'Letters A – J',  label_af: 'Letters A – J',  preview: '⠁⠃⠉', desc_en: '10 letters — simple patterns, dots 1,2,4,5 only', desc_af: '10 letters — eenvoudige patrone, punte 1,2,4,5',          cards: ALPHABET.slice(0, 10) },
  { id: 'k-t',    label_en: 'Letters K – T',  label_af: 'Letters K – T',  preview: '⠅⠇⠍', desc_en: '10 letters — add dot 3 to the A–J patterns',         desc_af: '10 letters — voeg punt 3 by die A–J-patrone',            cards: ALPHABET.slice(10, 20) },
  { id: 'u-z',    label_en: 'Letters U – Z',  label_af: 'Letters U – Z',  preview: '⠥⠧⠺', desc_en: '6 letters — add dot 6 to earlier patterns',           desc_af: '6 letters — voeg punt 6 by vroeër patrone',              cards: ALPHABET.slice(20) },
  { id: 'numbers',label_en: 'Numbers 0 – 9',  label_af: 'Syfers 0 – 9',   preview: '⠼⠁⠃', desc_en: '11 cards — the number indicator + digits 0–9',        desc_af: '11 kaarte — die getalteken + syfers 0–9',                cards: NUMBERS },
  { id: 'punct',  label_en: 'Punctuation',     label_af: 'Leestekens',     preview: '⠲⠂⠦', desc_en: '6 marks — full stop, comma, ?, !, hyphen, quote',     desc_af: '6 tekens — punt, komma, ?, !, koppelteken, aanhaling',   cards: PUNCTUATION },
]

// ─── Page state ──────────────────────────────────────────────────────────────

const phase = ref<'setup' | 'learn' | 'quiz' | 'results'>('setup')
const selectedLesson = ref<string>('a-j')

const currentCards = computed<BrailleCard[]>(() => {
  const lesson = lessons.find(l => l.id === selectedLesson.value)
  return lesson ? lesson.cards : []
})
const activeLessonLabel = computed(() => lessons.find(l => l.id === selectedLesson.value) || lessons[0]!)

// Learn state
const currentIndex = ref(0)
const flipped = ref(false)
const card = computed(() => currentCards.value[currentIndex.value] || {} as BrailleCard)

// Quiz state
const quizIndex = ref(0)
const quizAnswer = ref(-1)
const quizAnswered = ref(false)
const quizCorrect = ref(false)
const score = ref(0)
const quizCard = computed(() => currentCards.value[quizIndex.value] || {} as BrailleCard)

// Generate 4 options: correct + 3 distractors from same lesson
const quizOptions = computed(() => {
  if (!quizCard.value.label) return []
  const correct = quizCard.value
  const pool = ALPHABET.concat(NUMBERS.slice(1), PUNCTUATION)
  const distractors = pool
    .filter(c => c.label !== correct.label)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
  return [correct, ...distractors].sort(() => Math.random() - 0.5)
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dotsForChar(ch: string): boolean[] {
  if (!ch) return Array(6).fill(false)
  const cp = (ch.codePointAt(0) ?? 0x2800) - 0x2800
  return [0x01, 0x02, 0x04, 0x08, 0x10, 0x20].map(bit => (cp & bit) !== 0)
}

function activeDotNumbers(ch: string): string {
  const raised = dotsForChar(ch)
    .map((on, i) => on ? i + 1 : null)
    .filter((n): n is number => n !== null)
  return raised.length ? raised.join(', ') : '—'
}

// ─── Actions ─────────────────────────────────────────────────────────────────

function startLesson() {
  currentIndex.value = 0
  flipped.value = false
  phase.value = 'learn'
}
function next() { currentIndex.value++; flipped.value = false }
function prev() { currentIndex.value--; flipped.value = false }

function startQuiz() {
  quizIndex.value = 0
  quizAnswer.value = -1
  quizAnswered.value = false
  quizCorrect.value = false
  score.value = 0
  phase.value = 'quiz'
}

function answer(optIdx: number, label: string) {
  quizAnswer.value = optIdx
  quizAnswered.value = true
  quizCorrect.value = label === quizCard.value.label
  if (quizCorrect.value) score.value++
}

function nextQuestion() {
  if (quizIndex.value < currentCards.value.length - 1) {
    quizIndex.value++
    quizAnswer.value = -1
    quizAnswered.value = false
    quizCorrect.value = false
  } else {
    phase.value = 'results'
  }
}

function restartLearn() {
  currentIndex.value = 0
  flipped.value = false
  phase.value = 'learn'
}

function backToSetup() {
  phase.value = 'setup'
}
</script>

<style scoped>
.braille-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  width: 88px;
}
.dot-demo {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
  background: #e5e7eb;
  color: #9ca3af;
  border: 2px solid #d1d5db;
  transition: background 0.15s, border-color 0.15s;
}
.dot-demo.raised {
  background: #f59e0b;
  color: white;
  border-color: #d97706;
  box-shadow: 0 2px 6px rgba(245, 158, 11, 0.4);
}
</style>
