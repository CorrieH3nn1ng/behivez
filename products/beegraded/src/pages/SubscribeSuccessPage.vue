<template>
  <q-page class="flex column items-center justify-center q-pa-xl" style="background: #fef9f0; min-height: 100vh;">
    <q-icon name="celebration" size="80px" color="amber-7" />
    <div class="text-h4 text-weight-bold q-mt-md" style="color: #78350f;">
      {{ lang === 'af' ? 'Welkom aan boord! 🎉' : 'Welcome aboard! 🎉' }}
    </div>
    <div class="text-body1 text-grey-7 q-mt-sm text-center" style="max-width: 480px;">
      {{ lang === 'af'
        ? 'Jou inskrywing is bevestig. Jou vakke is nou ontsluit — begin toets en studeer!'
        : 'Your subscription is confirmed. Your subjects are now unlocked — start testing and studying!' }}
    </div>
    <div class="q-mt-xl row q-gutter-md">
      <q-btn class="btn-bee" no-caps icon="school" size="lg"
        :label="lang === 'af' ? 'Begin Nou' : 'Start Now'"
        :to="{ name: 'workspace-account' }" />
      <q-btn outline color="amber-8" no-caps icon="people"
        :label="lang === 'af' ? 'My Kinders' : 'My Children'"
        :to="{ name: 'my-children' }" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useI18n } from 'src/i18n'
const { lang } = useI18n()
</script>
