<template>
  <q-page class="honeycomb-bg q-pa-lg">
    <div style="max-width: 700px; margin: 0 auto;">
      <h2 class="text-h4 text-weight-bold q-mb-md" style="color: #78350f;">
        {{ lang === 'af' ? 'My Rekening' : 'My Account' }}
      </h2>

      <!-- Subscription Status -->
      <q-card flat class="bee-card q-pa-lg q-mb-md"
        :style="subscription.plan === 'free' ? 'border: 2px solid #fbbf24;' : 'border: 2px solid #16a34a;'">
        <div class="row items-center q-gutter-sm">
          <q-icon :name="subscription.plan === 'free' ? 'lock' : 'verified'" :color="subscription.plan === 'free' ? 'amber-7' : 'green'" size="28px" />
          <div>
            <div class="text-subtitle1 text-weight-bold" style="color: #78350f;">
              {{ subscription.plan === 'free'
                ? (lang === 'af' ? 'Gratis Plan' : 'Free Plan')
                : subscription.plan === 'per_subject'
                  ? (lang === 'af' ? 'Per Vak Plan' : 'Per Subject Plan')
                  : subscription.plan === 'three_subjects'
                    ? (lang === 'af' ? '3 Vakke Plan' : '3 Subjects Plan')
                    : (lang === 'af' ? 'Alle Vakke Plan' : 'All Subjects Plan') }}
            </div>
            <div v-if="subscription.expires_at" class="text-caption text-grey-6">
              {{ lang === 'af' ? 'Verval:' : 'Expires:' }} {{ new Date(subscription.expires_at).toLocaleDateString() }}
            </div>
            <div v-if="subscription.plan !== 'free' && subscription.subjects.length" class="text-caption text-grey-7">
              {{ subscription.subjects.join(', ') }}
            </div>
          </div>
          <q-space />
          <q-btn v-if="subscription.plan === 'free'" class="btn-bee" no-caps icon="upgrade" size="sm"
            :label="lang === 'af' ? 'Opgradeer' : 'Upgrade'"
            :to="{ name: 'subscribe' }" />
          <q-btn v-else outline color="amber-8" no-caps icon="refresh" size="sm"
            :label="lang === 'af' ? 'Hernu / Verander' : 'Renew / Change'"
            :to="{ name: 'subscribe' }" />
        </div>
      </q-card>

      <!-- Profile Info -->
      <q-card flat class="bee-card q-pa-lg q-mb-md">
        <div class="text-subtitle1 text-weight-bold q-mb-md" style="color: #78350f;">
          <q-icon name="person" color="amber" class="q-mr-sm" />
          {{ lang === 'af' ? 'Profiel' : 'Profile' }}
        </div>

        <div v-if="loadingProfile" class="text-center q-pa-md">
          <q-spinner-gears size="32px" color="amber" />
        </div>

        <template v-else-if="profile">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input :model-value="profile.name" outlined dense :label="lang === 'af' ? 'Naam' : 'Name'" readonly />
            </div>
            <div class="col-12 col-sm-6">
              <q-input :model-value="profile.email" outlined dense :label="lang === 'af' ? 'E-pos' : 'Email'" readonly />
            </div>
          </div>
        </template>
      </q-card>

      <!-- Language Preference -->
      <q-card flat class="bee-card q-pa-lg q-mb-md">
        <div class="text-subtitle1 text-weight-bold q-mb-xs" style="color: #78350f;">
          <q-icon name="language" color="amber" class="q-mr-sm" />
          {{ lang === 'af' ? 'Voorkeur Taal' : 'Preferred Language' }}
        </div>
        <div class="text-caption text-grey-6 q-mb-md">
          {{ lang === 'af'
            ? 'Jou huistaal / moedertaal. Gebruik vir die koppelvlak, kinders se toetse, EN vir verduidelikings in tutormodus in jou taal.'
            : 'Your home language / mother tongue. Used for the interface, children\'s tests, AND for explanations in tutor mode.' }}
        </div>

        <q-select
          v-model="selectedLang"
          outlined dense
          :label="lang === 'af' ? 'Kies taal' : 'Select language'"
          :options="languageOptions"
          emit-value map-options
          :loading="!!savingLang"
          @update:model-value="setPreferredLanguage"
          style="max-width: 320px;"
        />
      </q-card>

      <!-- Children (edit grade, language) -->
      <q-card v-if="children.length > 0" flat class="bee-card q-pa-lg q-mb-md">
        <div class="text-subtitle1 text-weight-bold q-mb-md" style="color: #78350f;">
          <q-icon name="child_care" color="amber" class="q-mr-sm" />
          {{ lang === 'af' ? 'Kinders' : 'Children' }}
        </div>

        <q-card
          v-for="child in children"
          :key="child.id"
          flat bordered
          class="q-pa-md q-mb-sm"
          style="border-color: #f5f0e8; border-radius: 8px;"
        >
          <div class="text-weight-bold q-mb-sm">{{ child.name }}</div>
          <div class="row q-gutter-sm q-mb-sm">
            <q-select
              v-model="child.grade"
              outlined dense
              :label="lang === 'af' ? 'Graad' : 'Grade'"
              :options="gradeOptions"
              emit-value map-options
              class="col"
              @update:model-value="updateChild(child)"
            />
            <q-select
              v-model="child.language"
              outlined dense
              :label="lang === 'af' ? 'Toets-taal' : 'Test language'"
              :options="languageOptions.map(l => ({ label: l.label, value: l.value }))"
              emit-value map-options
              class="col"
              @update:model-value="updateChild(child)"
            />
          </div>
          <q-select
            v-model="child.home_language"
            outlined dense clearable
            :label="lang === 'af' ? 'Huistaal (vir vertalings, bv. Setswana)' : 'Home language (for translations, e.g. Setswana)'"
            :options="languageOptions.map(l => ({ label: l.label, value: l.value }))"
            emit-value map-options
            class="q-mb-sm"
            @update:model-value="updateChild(child)"
          />
          <div class="row q-gutter-xs">
            <q-btn
              v-for="c in curriculumOptions"
              :key="c.value"
              no-caps dense
              :outline="child.curriculum !== c.value"
              :color="child.curriculum === c.value ? c.color : 'grey-6'"
              size="sm"
              :label="c.label"
              class="col"
              @click="child.curriculum = c.value; updateChild(child)"
            />
          </div>
          <div v-if="child.saved" class="text-caption text-positive q-mt-xs">
            <q-icon name="check" size="14px" /> {{ lang === 'af' ? 'Gestoor' : 'Saved' }}
          </div>
        </q-card>
      </q-card>

      <!-- Learn a Language -->
      <q-card flat class="bee-card q-pa-lg q-mb-md">
        <div class="text-subtitle1 text-weight-bold q-mb-xs" style="color: #78350f;">
          <q-icon name="school" color="amber" class="q-mr-sm" />
          {{ lang === 'af' ? 'Leer \'n Taal' : 'Learn a Language' }}
        </div>
        <div class="text-caption text-grey-6 q-mb-md">
          {{ lang === 'af' ? 'Leer nuwe woorde met flitskaarte en vasvrae' : 'Learn new words with flashcards and quizzes' }}
        </div>

        <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">
          {{ lang === 'af' ? 'SA Amptelike Tale' : 'SA Official Languages' }}
        </div>

        <div class="row q-col-gutter-xs q-mb-md" style="flex-wrap: wrap;">
          <div v-for="l in saLanguages" :key="l.code" class="col-6 col-sm-4">
            <q-btn outline :color="l.color" no-caps icon="translate" :label="l.label"
              class="full-width" style="font-size: 12px;" :to="`/workspace/learn/${l.code}`" />
          </div>
        </div>

        <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">
          {{ lang === 'af' ? 'Internasionale Tale' : 'International Languages' }}
        </div>
        <div class="row q-gutter-sm" style="flex-wrap: wrap;">
          <q-btn outline color="blue-8" no-caps icon="flag" label="French" style="flex: 1; min-width: 120px;" to="/workspace/learn/french" />
          <q-btn outline color="orange-9" no-caps icon="flag" label="Portuguese" style="flex: 1; min-width: 120px;" to="/workspace/learn/portuguese" />
          <q-btn outline color="red-7" no-caps icon="flag" label="Spanish" style="flex: 1; min-width: 120px;" to="/workspace/learn/spanish" />
          <q-btn outline color="teal-6" no-caps icon="flag" label="Swahili" style="flex: 1; min-width: 120px;" to="/workspace/learn/swahili" />
        </div>
      </q-card>

      <!-- Braille Literacy -->
      <q-card flat class="bee-card q-pa-lg q-mb-md">
        <div class="text-subtitle1 text-weight-bold q-mb-xs" style="color: #78350f;">
          <span style="font-size: 22px; margin-right: 8px;">⠃⠗⠇</span>
          {{ lang === 'af' ? 'Braille Geletterdheid' : 'Braille Literacy' }}
        </div>
        <div class="text-caption text-grey-6 q-mb-md">
          {{ lang === 'af'
            ? 'Leer die volledige Braille-alfabet, syfers en leestekens — met puntwysiger en toets'
            : 'Learn the full Braille alphabet, numbers and punctuation — with dot visualiser and quiz' }}
        </div>
        <q-btn outline color="amber-8" no-caps icon="touch_app"
          :label="lang === 'af' ? 'Begin Braille Leer' : 'Start Braille Lessons'"
          to="/workspace/braille" />
      </q-card>

      <!-- Generate for child selector -->
      <q-card v-if="children.length > 0" flat class="bee-card q-pa-md q-mb-md" style="background: #fef9ee;">
        <div class="row items-center q-gutter-sm">
          <q-icon name="child_care" color="amber-8" size="20px" />
          <div class="text-body2 text-weight-bold" style="color: #78350f;">
            {{ lang === 'af' ? 'Genereer vir:' : 'Generate for:' }}
          </div>
          <q-select
            v-model="activeChildId"
            dense outlined
            :options="[{ label: lang === 'af' ? '— Geen kind —' : '— No child —', value: null }, ...children.map(c => ({ label: c.name, value: c.id }))]"
            emit-value map-options
            style="min-width: 160px;"
            @update:model-value="onActiveChildChange"
          />
          <q-badge v-if="activeCurriculum !== 'caps'" :color="activeCurriculum === 'cambridge' ? 'indigo' : 'deep-orange'" class="q-pa-xs">
            {{ activeCurriculum === 'cambridge' ? 'Cambridge' : 'IEB' }}
          </q-badge>
        </div>
        <div v-if="activeChildId && activeCurriculum !== 'caps'" class="text-caption text-blue-7 q-mt-xs q-ml-lg">
          {{ activeCurriculum === 'cambridge' ? 'Cambridge curriculum — Maths, English, Science, History, Geography only' : 'IEB curriculum — Maths, English, Afrikaans, Science, History, Geography, Life Orientation only' }}
        </div>
      </q-card>

      <!-- Science: Life Skills Gr 1-3 -->
      <q-card v-if="fitsChild(1, 3)" flat class="bee-card q-pa-lg q-mb-md" :style="activeCurriculum !== 'caps' ? 'opacity: 0.45; pointer-events: none;' : ''">
        <div class="text-subtitle1 text-weight-bold q-mb-xs" style="color: #78350f;">
          <q-icon name="child_care" color="amber" class="q-mr-sm" />
          {{ lang === 'af' ? 'Lewensvaardighede (Gr 1–3)' : 'Life Skills — Beginning Knowledge (Gr 1–3)' }}
        </div>
        <div class="text-caption text-grey-6 q-mb-md">
          {{ lang === 'af' ? 'Diere, plante, weer, liggaam en veiligheid' : 'Animals, plants, weather, body and safety' }}
        </div>
        <div class="row items-center q-gutter-sm q-mb-md">
          <div class="text-body2 text-grey-7">{{ lang === 'af' ? 'Graad:' : 'Grade:' }}</div>
          <q-btn-toggle
            v-model="lifeSkillsGrade"
            toggle-color="amber-8" color="grey-2" text-color="grey-8" no-caps
            :options="[{ label: 'Gr 1', value: 1 }, { label: 'Gr 2', value: 2 }, { label: 'Gr 3', value: 3 }]"
          />
        </div>
        <div class="row q-gutter-sm">
          <q-btn outline color="amber-8" no-caps icon="school"
            :label="lang === 'af' ? 'Studeer Konsepte' : 'Study Concepts'"
            :to="`/workspace/science/life_skills/${lifeSkillsGrade}`" />
          <q-btn class="btn-bee" no-caps icon="play_arrow"
            :label="lang === 'af' ? 'Genereer Toets' : 'Generate Test'"
            :loading="generatingLifeSkills"
            @click="generateLifeSkillsTest" />
        </div>
        <q-banner v-if="lifeSkillsError" class="bg-red-1 text-red-8 q-mt-md" rounded>
          <template #avatar><q-icon name="error" color="red" /></template>
          {{ lifeSkillsError }}
        </q-banner>
      </q-card>

      <!-- Science: Natural Science Gr 4-9 -->
      <q-card v-if="fitsChild(4, 9)" flat class="bee-card q-pa-lg q-mb-md">
        <div class="text-subtitle1 text-weight-bold q-mb-xs" style="color: #78350f;">
          <q-icon name="science" color="amber" class="q-mr-sm" />
          {{ lang === 'af' ? 'Natuurwetenskap (Gr 4–9)' : 'Natural Sciences (Gr 4–9)' }}
        </div>
        <div class="text-caption text-grey-6 q-mb-md">
          {{ lang === 'af' ? 'Lewe, Materie, Energie en die Aarde — alle CAPS-modules' : 'Life, Matter, Energy and Earth — all CAPS modules' }}
        </div>

        <div class="row items-center q-gutter-sm q-mb-md">
          <div class="text-body2 text-grey-7">{{ lang === 'af' ? 'Graad:' : 'Grade:' }}</div>
          <q-btn-toggle
            v-model="scienceGrade"
            toggle-color="amber-8" color="grey-2" text-color="grey-8" no-caps
            :options="[4,5,6,7,8,9].map(g => ({ label: `Gr ${g}`, value: g }))"
            @update:model-value="scienceStrand = ''"
          />
        </div>

        <!-- Strand selector -->
        <div class="q-mb-md">
          <div class="text-caption text-grey-7 q-mb-xs">
            {{ lang === 'af' ? 'Fokus op strand (opsioneel):' : 'Focus on strand (optional):' }}
          </div>
          <div class="row q-gutter-xs" style="flex-wrap: wrap;">
            <q-btn
              v-for="s in scienceStrands"
              :key="s.value"
              no-caps size="sm"
              :outline="scienceStrand !== s.value"
              :color="scienceStrand === s.value ? 'amber-8' : 'grey-5'"
              :icon="s.icon"
              :label="lang === 'af' ? s.labelAf : s.labelEn"
              @click="scienceStrand = scienceStrand === s.value ? '' : s.value"
            />
          </div>
        </div>

        <q-banner v-if="scienceError" class="bg-red-1 text-red-8 q-mb-md" rounded>
          <template #avatar><q-icon name="error" color="red" /></template>
          {{ scienceError }}
        </q-banner>

        <div class="row q-gutter-sm">
          <q-btn outline color="amber-8" no-caps icon="school"
            :label="lang === 'af' ? 'Studeer Konsepte' : 'Study Concepts'"
            :to="{ path: `/workspace/science/natural_science/${scienceGrade}`, query: activeCurriculum !== 'caps' ? { curriculum: activeCurriculum } : {} }" />
          <q-btn class="btn-bee" no-caps icon="play_arrow"
            :label="lang === 'af' ? 'Genereer Toets' : 'Generate Test'"
            :loading="generatingScience"
            @click="generateScienceTest" />
        </div>
      </q-card>

      <!-- Mathematics Gr 7-9 -->
      <q-card v-if="fitsChild(7, 9)" flat class="bee-card q-pa-lg q-mb-md">
        <div class="text-subtitle1 text-weight-bold q-mb-xs" style="color: #78350f;">
          <q-icon name="calculate" color="amber" class="q-mr-sm" />
          {{ lang === 'af' ? 'Wiskunde (Gr 7–9)' : 'Mathematics (Gr 7–9)' }}
        </div>
        <div class="text-caption text-grey-6 q-mb-md">
          {{ lang === 'af' ? 'Algebra, meetkunde, funksies, finansiële wiskunde en datahantering' : 'Algebra, geometry, functions, financial maths and data handling' }}
        </div>
        <div class="row items-center q-gutter-sm q-mb-md">
          <div class="text-body2 text-grey-7">{{ lang === 'af' ? 'Graad:' : 'Grade:' }}</div>
          <q-btn-toggle
            v-model="mathSubjectGrade"
            toggle-color="amber-8" color="grey-2" text-color="grey-8" no-caps
            :options="[7,8,9].map(g => ({ label: `Gr ${g}`, value: g }))"
          />
        </div>
        <q-banner v-if="mathSubjectError" class="bg-red-1 text-red-8 q-mb-md" rounded>
          <template #avatar><q-icon name="error" color="red" /></template>
          {{ mathSubjectError }}
        </q-banner>
        <div class="row q-gutter-sm">
          <q-btn outline color="amber-8" no-caps icon="school"
            :label="lang === 'af' ? 'Studeer Konsepte' : 'Study Concepts'"
            :to="{ path: `/workspace/science/mathematics/${mathSubjectGrade}`, query: activeCurriculum !== 'caps' ? { curriculum: activeCurriculum } : {} }" />
          <q-btn class="btn-bee" no-caps icon="play_arrow"
            :label="lang === 'af' ? 'Genereer Toets' : 'Generate Test'"
            :loading="generatingMath"
            @click="generateMathSubjectTest" />
        </div>
      </q-card>

      <!-- Life Orientation Gr 4-9 -->
      <q-card v-if="fitsChild(4, 9)" flat class="bee-card q-pa-lg q-mb-md" :style="activeCurriculum === 'cambridge' ? 'opacity: 0.45; pointer-events: none;' : ''">
        <div class="text-subtitle1 text-weight-bold q-mb-xs" style="color: #78350f;">
          <q-icon name="self_improvement" color="amber" class="q-mr-sm" />
          {{ lang === 'af' ? 'Lewensoriëntering (Gr 4–9)' : 'Life Orientation (Gr 4–9)' }}
        </div>
        <div class="text-caption text-grey-6 q-mb-md">
          {{ lang === 'af' ? 'Persoonlike ontwikkeling, menseregte, loopbaan, fisiese opvoeding' : 'Personal development, human rights, career choices, physical education' }}
        </div>
        <div class="row items-center q-gutter-sm q-mb-md">
          <div class="text-body2 text-grey-7">{{ lang === 'af' ? 'Graad:' : 'Grade:' }}</div>
          <q-btn-toggle
            v-model="loGrade"
            toggle-color="amber-8" color="grey-2" text-color="grey-8" no-caps
            :options="[4,5,6,7,8,9].map(g => ({ label: `Gr ${g}`, value: g }))"
          />
        </div>
        <q-banner v-if="loError" class="bg-red-1 text-red-8 q-mb-md" rounded>
          <template #avatar><q-icon name="error" color="red" /></template>
          {{ loError }}
        </q-banner>
        <div class="row q-gutter-sm">
          <q-btn outline color="amber-8" no-caps icon="school"
            :label="lang === 'af' ? 'Studeer Konsepte' : 'Study Concepts'"
            :to="{ path: `/workspace/science/life_orientation/${loGrade}`, query: activeCurriculum !== 'caps' ? { curriculum: activeCurriculum } : {} }" />
          <q-btn class="btn-bee" no-caps icon="play_arrow"
            :label="lang === 'af' ? 'Genereer Toets' : 'Generate Test'"
            :loading="generatingLO"
            @click="generateLOTest" />
        </div>
      </q-card>

      <!-- Social Sciences Gr 4-9 -->
      <q-card v-if="fitsChild(4, 9)" flat class="bee-card q-pa-lg q-mb-md">
        <div class="text-subtitle1 text-weight-bold q-mb-xs" style="color: #78350f;">
          <q-icon name="public" color="amber" class="q-mr-sm" />
          {{ lang === 'af' ? 'Sosiale Wetenskappe (Gr 4–9)' : 'Social Sciences (Gr 4–9)' }}
        </div>
        <div class="text-caption text-grey-6 q-mb-md">
          {{ lang === 'af' ? 'Geskiedenis en Aardrykskunde — SA en wêreld CAPS-kurrikulum' : 'History and Geography — SA and world CAPS curriculum' }}
        </div>
        <div class="row items-center q-gutter-sm q-mb-sm">
          <div class="text-body2 text-grey-7">{{ lang === 'af' ? 'Graad:' : 'Grade:' }}</div>
          <q-btn-toggle
            v-model="socialGrade"
            toggle-color="amber-8" color="grey-2" text-color="grey-8" no-caps
            :options="[4,5,6,7,8,9].map(g => ({ label: `Gr ${g}`, value: g }))"
          />
        </div>
        <div class="row q-gutter-sm q-mb-md">
          <q-btn no-caps size="sm" icon="history_edu"
            :outline="socialStrand !== 'history'" :color="socialStrand === 'history' ? 'amber-8' : 'grey-5'"
            :label="lang === 'af' ? 'Geskiedenis' : 'History'"
            @click="socialStrand = 'history'" />
          <q-btn no-caps size="sm" icon="map"
            :outline="socialStrand !== 'geography'" :color="socialStrand === 'geography' ? 'amber-8' : 'grey-5'"
            :label="lang === 'af' ? 'Aardrykskunde' : 'Geography'"
            @click="socialStrand = 'geography'" />
        </div>
        <q-banner v-if="socialError" class="bg-red-1 text-red-8 q-mb-md" rounded>
          <template #avatar><q-icon name="error" color="red" /></template>
          {{ socialError }}
        </q-banner>
        <div class="row q-gutter-sm">
          <q-btn outline color="amber-8" no-caps icon="school"
            :label="lang === 'af' ? 'Studeer Konsepte' : 'Study Concepts'"
            :to="{ path: `/workspace/science/social_sciences/${socialGrade}`, query: activeCurriculum !== 'caps' ? { curriculum: activeCurriculum } : {} }" />
          <q-btn class="btn-bee" no-caps icon="play_arrow"
            :label="lang === 'af' ? 'Genereer Toets' : 'Generate Test'"
            :loading="generatingSocial"
            @click="generateSocialTest" />
        </div>
      </q-card>

      <!-- EMS Gr 4-9 -->
      <q-card v-if="fitsChild(4, 9)" flat class="bee-card q-pa-lg q-mb-md" :style="activeCurriculum !== 'caps' ? 'opacity: 0.45; pointer-events: none;' : ''">
        <div class="text-subtitle1 text-weight-bold q-mb-xs" style="color: #78350f;">
          <q-icon name="account_balance" color="amber" class="q-mr-sm" />
          {{ lang === 'af' ? 'EBW (Gr 4–9)' : 'EMS (Gr 4–9)' }}
        </div>
        <div class="text-caption text-grey-6 q-mb-md">
          {{ lang === 'af' ? 'Ekonomie, finansiële geletterdheid en entrepreneurskap' : 'Economy, financial literacy and entrepreneurship' }}
        </div>
        <div class="row items-center q-gutter-sm q-mb-md">
          <div class="text-body2 text-grey-7">{{ lang === 'af' ? 'Graad:' : 'Grade:' }}</div>
          <q-btn-toggle
            v-model="emsGrade"
            toggle-color="amber-8" color="grey-2" text-color="grey-8" no-caps
            :options="[4,5,6,7,8,9].map(g => ({ label: `Gr ${g}`, value: g }))"
          />
        </div>
        <q-banner v-if="emsError" class="bg-red-1 text-red-8 q-mb-md" rounded>
          <template #avatar><q-icon name="error" color="red" /></template>
          {{ emsError }}
        </q-banner>
        <div class="row q-gutter-sm">
          <q-btn outline color="amber-8" no-caps icon="school"
            :label="lang === 'af' ? 'Studeer Konsepte' : 'Study Concepts'"
            :to="`/workspace/science/ems/${emsGrade}`" />
          <q-btn class="btn-bee" no-caps icon="play_arrow"
            :label="lang === 'af' ? 'Genereer Toets' : 'Generate Test'"
            :loading="generatingEMS"
            @click="generateEMSTest" />
        </div>
      </q-card>

      <!-- Technology Gr 4-9 -->
      <q-card v-if="fitsChild(4, 9)" flat class="bee-card q-pa-lg q-mb-md" :style="activeCurriculum !== 'caps' ? 'opacity: 0.45; pointer-events: none;' : ''">
        <div class="text-subtitle1 text-weight-bold q-mb-xs" style="color: #78350f;">
          <q-icon name="engineering" color="amber" class="q-mr-sm" />
          {{ lang === 'af' ? 'Tegnologie (Gr 4–9)' : 'Technology (Gr 4–9)' }}
        </div>
        <div class="text-caption text-grey-6 q-mb-md">
          {{ lang === 'af' ? 'Ontwerpproses, strukture, meganiese en elektriese stelsels' : 'Design process, structures, mechanical and electrical systems' }}
        </div>
        <div class="row items-center q-gutter-sm q-mb-md">
          <div class="text-body2 text-grey-7">{{ lang === 'af' ? 'Graad:' : 'Grade:' }}</div>
          <q-btn-toggle
            v-model="techGrade"
            toggle-color="amber-8" color="grey-2" text-color="grey-8" no-caps
            :options="[4,5,6,7,8,9].map(g => ({ label: `Gr ${g}`, value: g }))"
          />
        </div>
        <q-banner v-if="techError" class="bg-red-1 text-red-8 q-mb-md" rounded>
          <template #avatar><q-icon name="error" color="red" /></template>
          {{ techError }}
        </q-banner>
        <div class="row q-gutter-sm">
          <q-btn outline color="amber-8" no-caps icon="school"
            :label="lang === 'af' ? 'Studeer Konsepte' : 'Study Concepts'"
            :to="`/workspace/science/technology/${techGrade}`" />
          <q-btn class="btn-bee" no-caps icon="play_arrow"
            :label="lang === 'af' ? 'Genereer Toets' : 'Generate Test'"
            :loading="generatingTech"
            @click="generateTechTest" />
        </div>
      </q-card>

      <!-- Creative Arts Gr 4-9 -->
      <q-card v-if="fitsChild(4, 9)" flat class="bee-card q-pa-lg q-mb-md" :style="activeCurriculum !== 'caps' ? 'opacity: 0.45; pointer-events: none;' : ''">
        <div class="text-subtitle1 text-weight-bold q-mb-xs" style="color: #78350f;">
          <q-icon name="palette" color="amber" class="q-mr-sm" />
          {{ lang === 'af' ? 'Skeppende Kunste (Gr 4–9)' : 'Creative Arts (Gr 4–9)' }}
        </div>
        <div class="text-caption text-grey-6 q-mb-md">
          {{ lang === 'af' ? 'Visuele Kunste, Musiek, Drama en Dans — teorie en SA kunsgeskiedenis' : 'Visual Arts, Music, Drama and Dance — theory and SA arts history' }}
        </div>
        <div class="row items-center q-gutter-sm q-mb-sm">
          <div class="text-body2 text-grey-7">{{ lang === 'af' ? 'Graad:' : 'Grade:' }}</div>
          <q-btn-toggle
            v-model="artsGrade"
            toggle-color="amber-8" color="grey-2" text-color="grey-8" no-caps
            :options="[4,5,6,7,8,9].map(g => ({ label: `Gr ${g}`, value: g }))"
            @update:model-value="artsStrand = 'visual_arts'"
          />
        </div>
        <div class="row q-gutter-xs q-mb-md" style="flex-wrap: wrap;">
          <q-btn no-caps size="sm" icon="palette"
            :outline="artsStrand !== 'visual_arts'" :color="artsStrand === 'visual_arts' ? 'pink-6' : 'grey-5'"
            :label="lang === 'af' ? 'Visuele Kunste' : 'Visual Arts'"
            @click="artsStrand = 'visual_arts'" />
          <q-btn no-caps size="sm" icon="music_note"
            :outline="artsStrand !== 'music'" :color="artsStrand === 'music' ? 'deep-purple-6' : 'grey-5'"
            :label="lang === 'af' ? 'Musiek' : 'Music'"
            @click="artsStrand = 'music'" />
          <q-btn no-caps size="sm" icon="theater_comedy"
            :outline="artsStrand !== 'drama'" :color="artsStrand === 'drama' ? 'deep-orange-6' : 'grey-5'"
            :label="lang === 'af' ? 'Drama' : 'Drama'"
            @click="artsStrand = 'drama'" />
          <q-btn no-caps size="sm" icon="directions_run"
            :outline="artsStrand !== 'dance'" :color="artsStrand === 'dance' ? 'teal-6' : 'grey-5'"
            :label="lang === 'af' ? 'Dans' : 'Dance'"
            @click="artsStrand = 'dance'" />
        </div>
        <q-banner v-if="artsError" class="bg-red-1 text-red-8 q-mb-md" rounded>
          <template #avatar><q-icon name="error" color="red" /></template>
          {{ artsError }}
        </q-banner>
        <div class="row q-gutter-sm">
          <q-btn outline color="amber-8" no-caps icon="school"
            :label="lang === 'af' ? 'Studeer Konsepte' : 'Study Concepts'"
            :to="`/workspace/science/creative_arts/${artsGrade}`" />
          <q-btn class="btn-bee" no-caps icon="play_arrow"
            :label="lang === 'af' ? 'Genereer Toets' : 'Generate Test'"
            :loading="generatingArts"
            @click="generateArtsTest" />
        </div>
      </q-card>

      <!-- EGD Gr 8-12 -->
      <q-card v-if="fitsChild(8, 12)" flat class="bee-card q-pa-lg q-mb-md" :style="activeCurriculum !== 'caps' ? 'opacity: 0.45; pointer-events: none;' : ''">
        <div class="text-subtitle1 text-weight-bold q-mb-xs" style="color: #78350f;">
          <q-icon name="architecture" color="amber" class="q-mr-sm" />
          {{ lang === 'af' ? 'Ingenieurstekene en -Ontwerp (Gr 8–12)' : 'Engineering Graphics and Design (Gr 8–12)' }}
        </div>
        <div class="text-caption text-grey-6 q-mb-md">
          {{ lang === 'af' ? 'Tegniese tekene, geometriese konstruksies, ruimtemeetkunde, meganiese en siviele tekene' : 'Technical drawing, geometric constructions, solid geometry, mechanical and civil drawing' }}
        </div>
        <div class="row items-center q-gutter-sm q-mb-md">
          <div class="text-body2 text-grey-7">{{ lang === 'af' ? 'Graad:' : 'Grade:' }}</div>
          <q-btn-toggle
            v-model="egdGrade"
            toggle-color="amber-8" color="grey-2" text-color="grey-8" no-caps
            :options="[8,9,10,11,12].map(g => ({ label: `Gr ${g}`, value: g }))"
          />
        </div>
        <q-banner v-if="egdError" class="bg-red-1 text-red-8 q-mb-md" rounded>
          <template #avatar><q-icon name="error" color="red" /></template>
          {{ egdError }}
        </q-banner>
        <div class="row q-gutter-sm">
          <q-btn outline color="amber-8" no-caps icon="school"
            :label="lang === 'af' ? 'Studeer Konsepte' : 'Study Concepts'"
            :to="`/workspace/science/egd/${egdGrade}`" />
          <q-btn class="btn-bee" no-caps icon="play_arrow"
            :label="lang === 'af' ? 'Genereer Toets' : 'Generate Test'"
            :loading="generatingEGD"
            @click="generateEGDTest" />
        </div>
      </q-card>

      <!-- Change Password -->
      <q-card flat class="bee-card q-pa-lg q-mb-md">
        <div class="text-subtitle1 text-weight-bold q-mb-md" style="color: #78350f;">
          <q-icon name="lock" color="amber" class="q-mr-sm" />
          {{ lang === 'af' ? 'Verander Wagwoord' : 'Change Password' }}
        </div>

        <q-input
          v-model="currentPassword"
          outlined dense
          :type="showCurrent ? 'text' : 'password'"
          :label="lang === 'af' ? 'Huidige wagwoord' : 'Current password'"
          class="q-mb-md"
          :disable="changingPassword"
        >
          <template #append>
            <q-icon :name="showCurrent ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="showCurrent = !showCurrent" />
          </template>
        </q-input>

        <q-input
          v-model="newPassword"
          outlined dense
          :type="showNew ? 'text' : 'password'"
          :label="lang === 'af' ? 'Nuwe wagwoord (min 8 karakters)' : 'New password (min 8 characters)'"
          class="q-mb-md"
          :disable="changingPassword"
        >
          <template #append>
            <q-icon :name="showNew ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="showNew = !showNew" />
          </template>
        </q-input>

        <q-btn
          class="btn-bee"
          no-caps
          :label="lang === 'af' ? 'Dateer Wagwoord Op' : 'Update Password'"
          :loading="changingPassword"
          :disable="!currentPassword || newPassword.length < 8"
          @click="handleChangePassword"
        />
      </q-card>

      <!-- Logout -->
      <q-btn
        flat no-caps
        color="red-4"
        icon="logout"
        :label="lang === 'af' ? 'Teken Uit' : 'Sign Out'"
        class="full-width q-mt-sm"
        @click="handleLogout"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'src/i18n'
import { useAuthStore } from 'src/stores/auth'
import { backendApi } from 'src/boot/axios'
import { useChildren } from 'src/composables/useChildren'
import { useSubscription } from 'src/composables/useSubscription'
import { Notify } from 'quasar'
import axios from 'axios'

const { lang, setLanguage } = useI18n()
const authStore = useAuthStore()
const router = useRouter()
const { listChildren, updateChild: updateChildApi } = useChildren()
const { subscription, loadSubscription } = useSubscription()

// Profile
const profile = ref<any>(null)
const loadingProfile = ref(true)

// Language
const selectedLang = ref('af')
const savingLang = ref('')

// Curriculum
const activeChildId = ref<number | null>(null)
const activeCurriculum = ref('caps')
const curriculumOptions = [
  { label: 'CAPS', value: 'caps', color: 'amber-8' },
  { label: 'Cambridge', value: 'cambridge', color: 'indigo' },
  { label: 'IEB', value: 'ieb', color: 'deep-orange' },
]
function onActiveChildChange(childId: number | null) {
  if (!childId) { activeCurriculum.value = 'caps'; return }
  const child = children.value.find((c: any) => c.id === childId)
  if (child) {
    activeCurriculum.value = child.curriculum || 'caps'
    // Auto-fill grades from child
    const g = child.grade
    if (g >= 1 && g <= 3) lifeSkillsGrade.value = g
    if (g >= 4 && g <= 9) { scienceGrade.value = g; loGrade.value = g; socialGrade.value = g; emsGrade.value = g; techGrade.value = g; artsGrade.value = g }
    if (g >= 7 && g <= 9) mathSubjectGrade.value = g
    if (g >= 8 && g <= 12) egdGrade.value = g
  }
}
const languageOptions = [
  { label: 'Afrikaans', value: 'af' },
  { label: 'English', value: 'en' },
  { label: 'IsiZulu', value: 'zu' },
  { label: 'IsiXhosa', value: 'xh' },
  { label: 'Setswana', value: 'tn' },
  { label: 'Sepedi', value: 'nso' },
  { label: 'Sesotho', value: 'st' },
  { label: 'Tshivenḓa', value: 've' },
  { label: 'Siswati', value: 'ss' },
  { label: 'Xitsonga', value: 'ts' },
  { label: 'isiNdebele', value: 'nr' },
]

// Children
const children = ref<any[]>([])

// When a child is selected in "Generate for:", only show subjects that fit their grade.
// No child selected → show every subject (parent browsing all grades).
const activeChild = computed<any>(() => {
  if (!activeChildId.value) return null
  return children.value.find((c: any) => c.id === activeChildId.value) || null
})
const activeChildGrade = computed<number | null>(() => activeChild.value ? activeChild.value.grade : null)
function fitsChild(min: number, max: number): boolean {
  const g = activeChildGrade.value
  if (g == null) return true
  return g >= min && g <= max
}
const gradeOptions = Array.from({ length: 12 }, (_, i) => ({
  label: `Gr ${i + 1}`,
  value: i + 1,
}))

// Password
const currentPassword = ref('')
const newPassword = ref('')
const showCurrent = ref(false)
const showNew = ref(false)
const changingPassword = ref(false)

// SA official languages for the language tutor
const saLanguages = [
  { code: 'afrikaans', label: 'Afrikaans', color: 'orange-8' },
  { code: 'english', label: 'English', color: 'purple' },
  { code: 'setswana', label: 'Setswana', color: 'cyan-8' },
  { code: 'zulu', label: 'IsiZulu', color: 'green-8' },
  { code: 'xhosa', label: 'IsiXhosa', color: 'teal-8' },
  { code: 'sepedi', label: 'Sepedi', color: 'indigo-6' },
  { code: 'sesotho', label: 'Sesotho', color: 'deep-purple-6' },
  { code: 'venda', label: 'Tshivenḓa', color: 'brown-6' },
  { code: 'swati', label: 'Siswati', color: 'pink-7' },
  { code: 'tsonga', label: 'Xitsonga', color: 'lime-8' },
  { code: 'ndebele', label: 'isiNdebele', color: 'amber-9' },
]

// Science test generation — Natural Science Gr 4-9
const scienceGrade = ref(7)
const scienceStrand = ref('')
const generatingScience = ref(false)
const scienceError = ref('')

const scienceStrands = [
  { value: 'life_and_living',     labelEn: 'Life & Living',     labelAf: 'Lewe & Lewende',  icon: 'eco' },
  { value: 'matter_and_materials', labelEn: 'Matter & Materials', labelAf: 'Materie',         icon: 'science' },
  { value: 'energy_and_change',   labelEn: 'Energy & Change',   labelAf: 'Energie',          icon: 'bolt' },
  { value: 'earth_and_beyond',    labelEn: 'Earth & Beyond',    labelAf: 'Aarde & Verder',   icon: 'public' },
]

// Life Skills — Gr 1-3
const lifeSkillsGrade = ref(1)
const generatingLifeSkills = ref(false)
const lifeSkillsError = ref('')

// Mathematics — Gr 7-9
const mathSubjectGrade = ref(7)
const generatingMath = ref(false)
const mathSubjectError = ref('')

// Life Orientation — Gr 4-9
const loGrade = ref(7)
const generatingLO = ref(false)
const loError = ref('')

// Social Sciences — Gr 4-9
const socialGrade = ref(7)
const socialStrand = ref('history')
const generatingSocial = ref(false)
const socialError = ref('')

// EMS — Gr 4-9
const emsGrade = ref(7)
const generatingEMS = ref(false)
const emsError = ref('')

// Technology — Gr 4-9
const techGrade = ref(7)
const generatingTech = ref(false)
const techError = ref('')

// Creative Arts — Gr 4-9
const artsGrade = ref(7)
const artsStrand = ref('visual_arts')
const generatingArts = ref(false)
const artsError = ref('')

// EGD — Gr 8-12
const egdGrade = ref(10)
const generatingEGD = ref(false)
const egdError = ref('')

async function setPreferredLanguage(newLang: string) {
  savingLang.value = newLang
  try {
    await backendApi.patch('/profile', { language: newLang })
    selectedLang.value = newLang
    setLanguage(newLang)
    Notify.create({
      type: 'positive',
      message: newLang === 'af' ? 'Taal opgedateer' : newLang === 'tn' ? 'Puo e fetoletswe' : 'Language updated',
      timeout: 1500,
    })
  } catch {
    Notify.create({ type: 'negative', message: 'Could not update language' })
  } finally {
    savingLang.value = ''
  }
}

async function updateChild(child: any) {
  try {
    await updateChildApi(child.id, { grade: child.grade, language: child.language, home_language: child.home_language || null, curriculum: child.curriculum || 'caps' })
    child.saved = true
    setTimeout(() => { child.saved = false }, 2000)
    // If this is the active child, update the active curriculum
    if (activeChildId.value === child.id) activeCurriculum.value = child.curriculum || 'caps'
  } catch {
    Notify.create({ type: 'negative', message: lang.value === 'af' ? 'Kon nie opdateer nie' : 'Could not update' })
  }
}

async function handleChangePassword() {
  changingPassword.value = true
  try {
    await authStore.changePassword(currentPassword.value, newPassword.value)
    Notify.create({ type: 'positive', message: lang.value === 'af' ? 'Wagwoord opgedateer!' : 'Password updated!' })
    currentPassword.value = ''
    newPassword.value = ''
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err?.response?.data?.error || 'Failed to change password' })
  } finally {
    changingPassword.value = false
  }
}

async function generateLifeSkillsTest() {
  generatingLifeSkills.value = true
  lifeSkillsError.value = ''
  try {
    const { data } = await backendApi.post('/subject-tests/generate', {
      subject_code: 'life_skills',
      grade: lifeSkillsGrade.value,
      language: activeChild.value?.language || lang.value,
      home_language: activeChild.value?.home_language || undefined,
      curriculum: activeCurriculum.value,
    })
    router.push({ name: 'math-test', params: { templateId: data.id } })
  } catch (err: any) {
    lifeSkillsError.value = err.response?.data?.message || (lang.value === 'af' ? 'Kon nie toets genereer nie' : 'Failed to generate test')
  } finally {
    generatingLifeSkills.value = false
  }
}

async function generateScienceTest() {
  generatingScience.value = true
  scienceError.value = ''
  try {
    const { data } = await backendApi.post('/subject-tests/generate', {
      subject_code: 'natural_science',
      grade: scienceGrade.value,
      language: activeChild.value?.language || lang.value,
      home_language: activeChild.value?.home_language || undefined,
      curriculum: activeCurriculum.value,
      ...(scienceStrand.value ? { strand: scienceStrand.value } : {}),
    })
    router.push({ name: 'math-test', params: { templateId: data.id } })
  } catch (err: any) {
    scienceError.value = err.response?.data?.message || (lang.value === 'af' ? 'Kon nie toets genereer nie' : 'Failed to generate test')
  } finally {
    generatingScience.value = false
  }
}

async function generateMathSubjectTest() {
  generatingMath.value = true
  mathSubjectError.value = ''
  try {
    const { data } = await backendApi.post('/subject-tests/generate', {
      subject_code: 'mathematics',
      grade: mathSubjectGrade.value,
      language: activeChild.value?.language || lang.value,
      home_language: activeChild.value?.home_language || undefined,
      curriculum: activeCurriculum.value,
    })
    router.push({ name: 'math-test', params: { templateId: data.id } })
  } catch (err: any) {
    mathSubjectError.value = err.response?.data?.message || (lang.value === 'af' ? 'Kon nie toets genereer nie' : 'Failed to generate test')
  } finally {
    generatingMath.value = false
  }
}

async function generateLOTest() {
  generatingLO.value = true
  loError.value = ''
  try {
    const { data } = await backendApi.post('/subject-tests/generate', {
      subject_code: 'life_orientation',
      grade: loGrade.value,
      language: activeChild.value?.language || lang.value,
      home_language: activeChild.value?.home_language || undefined,
      curriculum: activeCurriculum.value,
    })
    router.push({ name: 'math-test', params: { templateId: data.id } })
  } catch (err: any) {
    loError.value = err.response?.data?.message || (lang.value === 'af' ? 'Kon nie toets genereer nie' : 'Failed to generate test')
  } finally {
    generatingLO.value = false
  }
}

async function generateSocialTest() {
  generatingSocial.value = true
  socialError.value = ''
  try {
    const { data } = await backendApi.post('/subject-tests/generate', {
      subject_code: 'social_sciences',
      grade: socialGrade.value,
      language: activeChild.value?.language || lang.value,
      home_language: activeChild.value?.home_language || undefined,
      strand: socialStrand.value,
      curriculum: activeCurriculum.value,
    })
    router.push({ name: 'math-test', params: { templateId: data.id } })
  } catch (err: any) {
    socialError.value = err.response?.data?.message || (lang.value === 'af' ? 'Kon nie toets genereer nie' : 'Failed to generate test')
  } finally {
    generatingSocial.value = false
  }
}

async function generateEMSTest() {
  generatingEMS.value = true
  emsError.value = ''
  try {
    const { data } = await backendApi.post('/subject-tests/generate', {
      subject_code: 'ems',
      grade: emsGrade.value,
      language: activeChild.value?.language || lang.value,
      home_language: activeChild.value?.home_language || undefined,
    })
    router.push({ name: 'math-test', params: { templateId: data.id } })
  } catch (err: any) {
    emsError.value = err.response?.data?.message || (lang.value === 'af' ? 'Kon nie toets genereer nie' : 'Failed to generate test')
  } finally {
    generatingEMS.value = false
  }
}

async function generateTechTest() {
  generatingTech.value = true
  techError.value = ''
  try {
    const { data } = await backendApi.post('/subject-tests/generate', {
      subject_code: 'technology',
      grade: techGrade.value,
      language: activeChild.value?.language || lang.value,
      home_language: activeChild.value?.home_language || undefined,
    })
    router.push({ name: 'math-test', params: { templateId: data.id } })
  } catch (err: any) {
    techError.value = err.response?.data?.message || (lang.value === 'af' ? 'Kon nie toets genereer nie' : 'Failed to generate test')
  } finally {
    generatingTech.value = false
  }
}

async function generateArtsTest() {
  generatingArts.value = true
  artsError.value = ''
  try {
    const { data } = await backendApi.post('/subject-tests/generate', {
      subject_code: 'creative_arts',
      grade: artsGrade.value,
      language: activeChild.value?.language || lang.value,
      home_language: activeChild.value?.home_language || undefined,
      strand: artsStrand.value,
    })
    router.push({ name: 'math-test', params: { templateId: data.id } })
  } catch (err: any) {
    artsError.value = err.response?.data?.message || (lang.value === 'af' ? 'Kon nie toets genereer nie' : 'Failed to generate test')
  } finally {
    generatingArts.value = false
  }
}

async function generateEGDTest() {
  generatingEGD.value = true
  egdError.value = ''
  try {
    const { data } = await backendApi.post('/subject-tests/generate', {
      subject_code: 'egd',
      grade: egdGrade.value,
      language: activeChild.value?.language || lang.value,
      home_language: activeChild.value?.home_language || undefined,
    })
    router.push({ name: 'math-test', params: { templateId: data.id } })
  } catch (err: any) {
    egdError.value = err.response?.data?.message || (lang.value === 'af' ? 'Kon nie toets genereer nie' : 'Failed to generate test')
  } finally {
    generatingEGD.value = false
  }
}

async function handleLogout() {
  await authStore.logout()
  router.push({ name: 'landing' })
}

onMounted(async () => {
  // Load auth profile
  try {
    const { data } = await axios.get('/auth/me', {
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    })
    profile.value = data
  } catch {
    profile.value = authStore.user
  } finally {
    loadingProfile.value = false
  }

  // Load local profile (language preference)
  try {
    const { data } = await backendApi.get('/profile')
    selectedLang.value = data.language || 'af'
    setLanguage(data.language || 'af')
  } catch { /* use default */ }

  // Load children
  try {
    const data = await listChildren()
    children.value = (data.children || []).map((c: any) => ({ ...c, curriculum: c.curriculum || 'caps', saved: false }))
  } catch { /* no children yet */ }

  // Load subscription
  await loadSubscription()
})
</script>
