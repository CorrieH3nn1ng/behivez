<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Business Profile</div>

    <q-form @submit="handleSave">
      <!-- Personal / SARS -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6 q-mb-sm">Personal / SARS Details</div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input v-model="form.account_holder" label="Full Name" outlined dense />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.id_number" label="SA ID Number" outlined dense maxlength="13" mask="#############" />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.tax_reference" label="SARS Tax Reference" outlined dense placeholder="0000000000" />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.tax_number" label="Income Tax Number" outlined dense />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.vat_number" label="VAT Number" outlined dense hint="Only if VAT registered" />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Business Details -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6 q-mb-sm">Business Details</div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input v-model="form.business_name" label="Business / Company Name" outlined dense />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.trading_as" label="Trading As" outlined dense hint="If different from business name" />
            </div>
            <div class="col-12 col-sm-6">
              <q-select
                v-model="form.business_type"
                :options="businessTypes"
                label="Business Type"
                outlined
                dense
                emit-value
                map-options
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.registration_number" label="Registration Number (CIPC)" outlined dense hint="If registered company" />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.industry" label="Industry / Profession" outlined dense placeholder="e.g. Software Engineering" />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.website" label="Website" outlined dense placeholder="https://" />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.email" label="Business Email" type="email" outlined dense />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.phone" label="Business Phone" outlined dense />
            </div>
            <div class="col-12">
              <q-input v-model="form.address" label="Business Address" type="textarea" outlined dense autogrow rows="2" />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Banking Details -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6 q-mb-sm">Banking Details</div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input v-model="form.bank_name" label="Bank Name" outlined dense />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.account_number" label="Account Number" outlined dense />
            </div>
            <div class="col-12 col-sm-6">
              <q-select
                v-model="form.account_type"
                :options="['Cheque', 'Savings', 'Business', 'Transmission']"
                label="Account Type"
                outlined
                dense
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.branch_code" label="Branch Code" outlined dense />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Invoice Defaults -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6 q-mb-sm">Invoice Defaults</div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-4">
              <q-select
                v-model="form.default_currency"
                :options="['ZAR', 'USD', 'EUR', 'GBP']"
                label="Default Currency"
                outlined
                dense
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-input v-model="form.default_tax_rate" label="Default VAT Rate (%)" outlined dense />
            </div>
            <div class="col-12 col-sm-4">
              <q-input v-model="form.payment_terms" label="Payment Terms" outlined dense placeholder="e.g. Net 30" />
            </div>
            <div class="col-12">
              <q-input
                v-model="form.invoice_footer"
                label="Invoice Footer Text"
                type="textarea"
                outlined
                dense
                autogrow
                rows="2"
                hint="Appears at the bottom of every invoice"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Logo Upload -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6 q-mb-sm">Logo</div>
          <div class="row items-center q-gutter-md">
            <div v-if="logoPreview" class="col-auto">
              <q-img :src="logoPreview" style="width: 120px; height: 120px" fit="contain" class="rounded-borders" />
            </div>
            <div class="col">
              <q-file
                v-model="logoFile"
                label="Upload logo (JPG/PNG, max 2MB)"
                outlined
                dense
                accept=".jpg,.jpeg,.png"
                max-file-size="2097152"
                @update:model-value="handleLogoUpload"
                :loading="uploadingLogo"
              >
                <template v-slot:prepend>
                  <q-icon name="image" />
                </template>
              </q-file>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <div class="row justify-end">
        <q-btn type="submit" color="primary" label="Save Profile" :loading="saving" unelevated />
      </div>
    </q-form>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { businessProfileApi } from '@/services/api/business-profile.api';

const $q = useQuasar();
const saving = ref(false);
const logoFile = ref<File | null>(null);
const logoPreview = ref<string | null>(null);
const uploadingLogo = ref(false);

const businessTypes = [
  { label: 'Sole Proprietor', value: 'sole_proprietor' },
  { label: 'PTY Ltd', value: 'pty_ltd' },
  { label: 'Close Corporation (CC)', value: 'cc' },
  { label: 'Freelancer / Independent Contractor', value: 'freelancer' },
  { label: 'Partnership', value: 'partnership' },
  { label: 'Non-Profit', value: 'non_profit' },
];

const form = ref({
  // Personal / SARS
  account_holder: '',
  id_number: '',
  tax_reference: '',
  tax_number: '',
  vat_number: '',
  // Business
  business_name: '',
  trading_as: '',
  business_type: '',
  registration_number: '',
  industry: '',
  website: '',
  email: '',
  phone: '',
  address: '',
  // Banking
  bank_name: '',
  account_number: '',
  account_type: '',
  branch_code: '',
  // Invoice defaults
  default_currency: 'ZAR',
  default_tax_rate: '0',
  payment_terms: '',
  invoice_footer: '',
});

async function handleSave() {
  saving.value = true;
  try {
    await businessProfileApi.update(form.value);
    $q.notify({ type: 'positive', message: 'Profile saved' });
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to save profile' });
  } finally {
    saving.value = false;
  }
}

async function handleLogoUpload(file: File | null) {
  if (!file) return;
  uploadingLogo.value = true;
  try {
    await businessProfileApi.uploadLogo(file);
    logoPreview.value = URL.createObjectURL(file);
    $q.notify({ type: 'positive', message: 'Logo uploaded' });
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to upload logo' });
  } finally {
    uploadingLogo.value = false;
    logoFile.value = null;
  }
}

onMounted(async () => {
  try {
    const res = await businessProfileApi.get();
    const p = res.data.data;
    form.value = {
      account_holder: p.account_holder || '',
      id_number: p.id_number || '',
      tax_reference: p.tax_reference || '',
      tax_number: p.tax_number || '',
      vat_number: p.vat_number || '',
      business_name: p.business_name || '',
      trading_as: p.trading_as || '',
      business_type: p.business_type || '',
      registration_number: p.registration_number || '',
      industry: p.industry || '',
      website: p.website || '',
      email: p.email || '',
      phone: p.phone || '',
      address: p.address || '',
      bank_name: p.bank_name || '',
      account_number: p.account_number || '',
      account_type: p.account_type || '',
      branch_code: p.branch_code || '',
      default_currency: p.default_currency || 'ZAR',
      default_tax_rate: p.default_tax_rate || '15',
      payment_terms: p.payment_terms || '',
      invoice_footer: p.invoice_footer || '',
    };
    // TODO: Load logo preview from backend if logo_path exists
  } catch { /* profile will be created on first save */ }
});
</script>
