<template>
  <q-page class="q-pa-xl">
    <div class="text-center q-mb-xl">
      <h1 class="text-h3 text-weight-bold text-grey-9 q-mb-sm">Pricing</h1>
      <p class="text-body1 text-grey-7" style="max-width: 500px; margin: 0 auto;">
        Simple, honest pricing in ZAR. Start free, upgrade when you're ready.
      </p>
    </div>

    <q-spinner-dots v-if="loading" size="48px" color="amber-8" class="q-mx-auto block q-my-xl" />

    <q-banner v-if="error" class="bg-red-1 text-red-8 q-mb-lg" rounded>
      {{ error }}
    </q-banner>

    <div v-for="product in products" :key="product.product" class="q-mb-xl">
      <div class="text-h5 text-weight-bold text-grey-9 q-mb-md text-capitalize">
        {{ productLabels[product.product] || product.product }}
      </div>

      <div class="row q-gutter-lg items-stretch">
        <div v-for="plan in product.plans" :key="plan.id" class="col-12 col-sm-5 col-md-4" style="display: flex;">
          <q-card class="plan-card full-width flex column" flat bordered :class="plan.priceCents > 0 ? 'plan-pro' : ''">
            <q-card-section>
              <div class="text-h6 text-weight-bold text-grey-9">{{ plan.name }}</div>
              <div class="text-h4 text-weight-bold q-mt-sm" :class="plan.priceCents > 0 ? 'text-amber-9' : 'text-grey-7'">
                {{ plan.priceCents === 0 ? 'Free' : formatPrice(plan.priceCents) }}
              </div>
              <div v-if="plan.priceCents > 0" class="text-caption text-grey-6">per month</div>
              <div v-else class="text-caption text-grey-6">no account needed</div>
            </q-card-section>

            <q-separator />

            <q-card-section class="col">
              <q-list dense>
                <q-item v-for="feature in plan.features" :key="feature" class="q-px-none">
                  <q-item-section avatar style="min-width: 28px;">
                    <q-icon name="check_circle" size="18px" color="green-7" />
                  </q-item-section>
                  <q-item-section class="text-grey-8">{{ feature }}</q-item-section>
                </q-item>
              </q-list>
            </q-card-section>

            <q-card-actions class="q-pa-md">
              <q-btn
                v-if="plan.priceCents === 0"
                label="Try It Free"
                color="grey-7"
                text-color="white"
                no-caps
                unelevated
                class="full-width"
                :href="productUrls[product.product]"
                target="_blank"
              />
              <q-btn
                v-else
                label="Subscribe"
                color="amber-8"
                text-color="white"
                no-caps
                unelevated
                class="full-width"
                :loading="checkoutLoading === `${product.product}_${plan.id}`"
                @click="handleSubscribe(product.product, plan.id)"
              />
            </q-card-actions>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Notify } from 'quasar'
import { usePaymentsStore, type ProductPlans } from 'stores/payments'
import { useAuthStore } from 'stores/auth'

const router = useRouter()
const auth = useAuthStore()
const paymentsStore = usePaymentsStore()

const products = ref<ProductPlans[]>([])
const loading = ref(true)
const error = ref('')
const checkoutLoading = ref('')

const productLabels: Record<string, string> = {
  beegraded: 'BeeGraded',
  pollenz: 'Pollenz',
  swarmz: 'Swarmz',
  broodz: 'Broodz',
}

const productUrls: Record<string, string> = {
  beegraded: 'https://beegraded.co.za',
  pollenz: 'https://pollenz.co.za',
  swarmz: 'https://swarmz.co.za',
  broodz: 'https://broodz.co.za',
}

function formatPrice(cents: number): string {
  return `R${(cents / 100).toFixed(0)}`
}

onMounted(async () => {
  try {
    await paymentsStore.fetchPlans()
    products.value = paymentsStore.products
  } catch {
    error.value = 'Failed to load plans. Please try again.'
  } finally {
    loading.value = false
  }
})

async function handleSubscribe(product: string, plan: string) {
  if (!auth.isLoggedIn) {
    router.push({ path: '/login', query: { redirect: '/pricing', product, plan } })
    return
  }

  checkoutLoading.value = `${product}_${plan}`
  try {
    const { payFastUrl, formData } = await paymentsStore.checkout(product, plan)

    // Create a hidden form and submit to PayFast
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = payFastUrl
    for (const [key, value] of Object.entries(formData)) {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = key
      input.value = value
      form.appendChild(input)
    }
    document.body.appendChild(form)
    form.submit()
  } catch (err: any) {
    Notify.create({
      type: 'negative',
      message: err?.response?.data?.message || 'Checkout failed. Please try again.',
    })
  } finally {
    checkoutLoading.value = ''
  }
}
</script>

<style lang="scss" scoped>
.plan-card {
  background: #fffbeb;
  border-color: rgba(245, 158, 11, 0.2) !important;
  transition: transform 0.2s, border-color 0.2s;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(245, 158, 11, 0.5) !important;
  }
}

.plan-pro {
  border-color: rgba(245, 158, 11, 0.4) !important;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}
</style>
