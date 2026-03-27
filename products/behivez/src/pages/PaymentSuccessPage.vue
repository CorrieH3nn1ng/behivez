<template>
  <q-page class="flex flex-center" style="min-height: 70vh;">
    <div class="text-center" style="max-width: 500px;">
      <q-icon name="check_circle" size="80px" color="green-7" />
      <div class="text-h4 text-weight-bold text-grey-9 q-mt-lg">Payment Successful</div>
      <p class="text-body1 text-grey-7 q-mt-md">
        Your subscription is being activated. This usually takes a few seconds.
      </p>
      <div class="q-mt-lg q-gutter-sm">
        <q-btn
          label="My Subscriptions"
          color="amber-8"
          text-color="white"
          no-caps
          unelevated
          to="/my/subscriptions"
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
