<template>
  <q-page class="flex flex-center" style="min-height: 70vh;">
    <div class="text-center" style="max-width: 500px;">
      <q-icon name="cancel" size="80px" color="orange-7" />
      <div class="text-h4 text-weight-bold text-grey-9 q-mt-lg">Payment Cancelled</div>
      <p class="text-body1 text-grey-7 q-mt-md">
        Your payment was cancelled. No charges were made. You can try again anytime.
      </p>
      <div class="q-mt-lg q-gutter-sm">
        <q-btn
          label="View Pricing"
          color="amber-8"
          text-color="white"
          no-caps
          unelevated
          to="/pricing"
        />
        <q-btn
          label="Back to Home"
          color="grey-7"
          text-color="white"
          no-caps
          unelevated
          to="/"
        />
      </div>
    </div>
  </q-page>
</template>
