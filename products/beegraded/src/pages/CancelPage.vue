<template>
  <q-page class="honeycomb-bg flex flex-center" style="min-height: 80vh;">
    <q-card flat class="bee-card q-pa-xl text-center" style="max-width: 480px; width: 100%;">
      <q-icon name="cancel" size="64px" color="grey-5" class="q-mb-md" />
      <h2 class="text-h5 text-weight-bold q-mb-xs">Payment Cancelled</h2>
      <p class="text-grey-7 q-mb-lg" style="font-size: 14px;">
        No worries — your paper is still saved. You can try again anytime.
      </p>
      <div class="row q-gutter-md justify-center">
        <q-btn class="btn-bee" no-caps label="Try Again" to="/upload" icon="refresh" />
        <q-btn outline no-caps color="grey-7" label="Go Home" to="/" />
      </div>
    </q-card>
  </q-page>
</template>
