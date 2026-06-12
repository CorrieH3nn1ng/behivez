<template>
  <q-page padding>
    <div class="text-h5 text-weight-bold q-mb-xs">Settings</div>
    <div class="text-grey-7 q-mb-md" style="font-size: 14px;">
      Turn on only what you need. Everything off by default — no clutter, no nagging.
    </div>

    <!-- Feature modules -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section class="q-pb-none">
        <div class="text-subtitle1 text-weight-bold">Features</div>
        <div class="text-caption text-grey-6">Choose which tools appear in your app.</div>
      </q-card-section>
      <q-list>
        <!-- Expenses — core, always on -->
        <q-item>
          <q-item-section avatar><q-icon name="payments" color="primary" /></q-item-section>
          <q-item-section>
            <q-item-label>Expense & fuel tracking</q-item-label>
            <q-item-label caption>Always on — the heart of Swarmz.</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-badge color="grey-4" text-color="grey-8" label="Always on" />
          </q-item-section>
        </q-item>

        <q-separator inset />

        <!-- AI scan -->
        <q-item tag="label">
          <q-item-section avatar><q-icon name="document_scanner" color="primary" /></q-item-section>
          <q-item-section>
            <q-item-label>
              AI slip & invoice scanning
              <q-badge color="amber-7" text-color="white" label="Solo Pro" class="q-ml-xs" />
            </q-item-label>
            <q-item-label caption>Snap a slip — we fill in the expense for you.</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-toggle :model-value="m.aiScan" @update:model-value="v => toggleModule('aiScan', v)" color="primary" />
          </q-item-section>
        </q-item>

        <!-- Tax & logbook -->
        <q-item tag="label">
          <q-item-section avatar><q-icon name="receipt_long" color="teal" /></q-item-section>
          <q-item-section>
            <q-item-label>
              Travel logbook & SARS tax
              <q-badge color="amber-7" text-color="white" label="Solo Pro" class="q-ml-xs" />
            </q-item-label>
            <q-item-label caption>Log trips and compare SARS deduction methods. For the self-employed.</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-toggle :model-value="m.tax" @update:model-value="v => toggleModule('tax', v)" color="teal" />
          </q-item-section>
        </q-item>

        <!-- Fleet — entitlement owned by shared auth (Fleet plan required) -->
        <q-item :tag="isFleetAccount ? 'label' : undefined">
          <q-item-section avatar><q-icon name="local_shipping" color="deep-orange" /></q-item-section>
          <q-item-section>
            <q-item-label>
              Fleet management
              <q-badge color="deep-orange" text-color="white" label="Fleet" class="q-ml-xs" />
            </q-item-label>
            <q-item-label caption>
              <template v-if="isFleetAccount">Drivers, vehicle status workflow and multi-vehicle tools.</template>
              <template v-else>Available on the Fleet plan — upgrade your account to switch this on.</template>
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-toggle
              :model-value="m.fleet"
              :disable="!isFleetAccount"
              @update:model-value="v => toggleModule('fleet', v)"
              color="deep-orange"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <!-- Notifications -->
    <q-card flat bordered>
      <q-card-section class="q-pb-none">
        <div class="text-subtitle1 text-weight-bold">Notifications</div>
        <div class="text-caption text-grey-6">All off by default. Switch on only what you want to hear about.</div>
      </q-card-section>
      <q-list>
        <q-item tag="label">
          <q-item-section avatar><q-icon name="event_busy" /></q-item-section>
          <q-item-section>
            <q-item-label>Licence disk expiry</q-item-label>
            <q-item-label caption>Remind me before my licence disk runs out.</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-toggle :model-value="n.licenceExpiry" @update:model-value="v => toggleNotif('licenceExpiry', v)" color="primary" />
          </q-item-section>
        </q-item>

        <q-item tag="label">
          <q-item-section avatar><q-icon name="build" /></q-item-section>
          <q-item-section>
            <q-item-label>Service / maintenance due</q-item-label>
            <q-item-label caption>Remind me when a service is coming up.</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-toggle :model-value="n.serviceDue" @update:model-value="v => toggleNotif('serviceDue', v)" color="primary" />
          </q-item-section>
        </q-item>

        <!-- Tax year-end only makes sense if the Tax module is on -->
        <q-item v-if="m.tax" tag="label">
          <q-item-section avatar><q-icon name="calendar_month" /></q-item-section>
          <q-item-section>
            <q-item-label>Tax year-end reminder</q-item-label>
            <q-item-label caption>Nudge me to finalise my logbook before the SARS deadline.</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-toggle :model-value="n.taxYearEnd" @update:model-value="v => toggleNotif('taxYearEnd', v)" color="primary" />
          </q-item-section>
        </q-item>

        <q-item tag="label">
          <q-item-section avatar><q-icon name="summarize" /></q-item-section>
          <q-item-section>
            <q-item-label>Monthly spend summary</q-item-label>
            <q-item-label caption>A once-a-month recap of what I spent.</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-toggle :model-value="n.monthlySummary" @update:model-value="v => toggleNotif('monthlySummary', v)" color="primary" />
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <div class="text-center text-caption text-grey-5 q-mt-lg">Swarmz v1.0.0</div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useAuthStore } from 'stores/auth';
import { useSettingsStore, type FeatureModules, type NotificationPrefs } from 'stores/settings';

const authStore = useAuthStore();
const settings = useSettingsStore();

const m = computed(() => settings.modules);
const n = computed(() => settings.notifications);
// Fleet entitlement comes from the shared-auth plan, not a free local toggle.
const isFleetAccount = computed(() => authStore.user?.plan === 'fleet');

function toggleModule(key: keyof FeatureModules, value: boolean) {
  settings.setModule(key, value);
}
function toggleNotif(key: keyof NotificationPrefs, value: boolean) {
  settings.setNotification(key, value);
}

onMounted(() => {
  if (!settings.loaded) settings.fetch();
});
</script>
