<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Payslips</div>

    <!-- Upload Payslip -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row items-center q-gutter-sm">
          <q-icon name="upload_file" size="sm" color="primary" />
          <div class="text-h6">Upload Payslip</div>
        </div>
        <q-file
          v-model="payslipFile"
          label="Drop your payslip (PDF, photo, or screenshot)"
          outlined
          dense
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          max-file-size="10485760"
          class="q-mt-sm"
          @update:model-value="handlePayslipUpload"
        >
          <template v-slot:prepend>
            <q-icon name="cloud_upload" />
          </template>
        </q-file>
        <div class="text-caption text-grey-6 q-mt-xs">
          Supports PDF, JPEG, PNG — WhatsApp photos work too
        </div>
        <q-linear-progress
          v-if="extracting"
          indeterminate
          color="primary"
          class="q-mt-sm"
          rounded
        />
        <div v-if="extracting" class="text-caption text-grey q-mt-xs">
          Extracting payslip data...
        </div>
      </q-card-section>
    </q-card>

    <!-- Payslip Summary -->
    <div v-if="payslips.length" class="row q-col-gutter-md q-mb-md">
      <div class="col-6 col-sm-3">
        <q-card class="bg-green-1">
          <q-card-section class="q-pa-sm text-center">
            <div class="text-caption text-grey-7">Total Gross</div>
            <div class="text-h6 text-green-9">R{{ fmt(summary.total_gross) }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-sm-3">
        <q-card class="bg-blue-1">
          <q-card-section class="q-pa-sm text-center">
            <div class="text-caption text-grey-7">Total Net</div>
            <div class="text-h6 text-blue-9">R{{ fmt(summary.total_net) }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-sm-3">
        <q-card class="bg-red-1">
          <q-card-section class="q-pa-sm text-center">
            <div class="text-caption text-grey-7">Total PAYE</div>
            <div class="text-h6 text-red-9">R{{ fmt(summary.total_paye) }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-sm-3">
        <q-card class="bg-grey-2">
          <q-card-section class="q-pa-sm text-center">
            <div class="text-caption text-grey-7">Payslips</div>
            <div class="text-h6">{{ summary.count }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Payslip History -->
    <q-card v-if="payslips.length" class="q-mb-md">
      <q-card-section>
        <div class="text-h6 q-mb-sm">Payslip History</div>
      </q-card-section>
      <q-list separator>
        <q-expansion-item
          v-for="slip in payslips"
          :key="slip.id"
          group="payslips"
          header-class="q-pa-md"
        >
          <template v-slot:header>
            <q-item-section>
              <q-item-label>
                {{ slip.pay_period || slip.pay_date || 'Unknown period' }}
              </q-item-label>
              <q-item-label caption>
                {{ slip.employer_name || 'Unknown employer' }}
                <span v-if="slip.designation"> &mdash; {{ slip.designation }}</span>
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <div class="text-right">
                <div class="text-subtitle2 text-green-8">R{{ fmt(slip.gross_salary) }}</div>
                <div class="text-caption text-grey-6">Net: R{{ fmt(slip.net_salary) }}</div>
              </div>
            </q-item-section>
            <q-item-section side>
              <q-btn flat round dense icon="delete" color="negative" size="sm" @click.stop="confirmDelete(slip)">
                <q-tooltip>Delete</q-tooltip>
              </q-btn>
            </q-item-section>
          </template>

          <q-card flat class="q-mx-md q-mb-md bg-grey-1" style="border-radius: 12px">
            <q-card-section class="q-pa-sm">
              <!-- Earnings -->
              <div class="text-subtitle2 text-primary q-mb-xs">Earnings</div>
              <div class="row-line" v-if="slip.gross_salary"><span>Gross Salary</span><span class="text-green-8">R{{ fmt(slip.gross_salary) }}</span></div>
              <div class="row-line" v-if="n(slip.overtime)"><span>Overtime</span><span>R{{ fmt(slip.overtime) }}</span></div>
              <div class="row-line" v-if="n(slip.bonus)"><span>Bonus</span><span>R{{ fmt(slip.bonus) }}</span></div>
              <div class="row-line" v-if="n(slip.commission)"><span>Commission</span><span>R{{ fmt(slip.commission) }}</span></div>
              <div class="row-line" v-if="n(slip.travel_allowance)"><span>Travel Allowance</span><span>R{{ fmt(slip.travel_allowance) }}</span></div>
              <template v-if="slip.other_earnings?.length">
                <div class="row-line" v-for="(e, i) in slip.other_earnings" :key="'oe'+i">
                  <span>{{ e.name }}</span><span>R{{ fmt(e.amount) }}</span>
                </div>
              </template>
              <q-separator class="q-my-sm" />

              <!-- Deductions -->
              <div class="text-subtitle2 text-red-8 q-mb-xs">Deductions</div>
              <div class="row-line" v-if="n(slip.paye)"><span>PAYE</span><span>R{{ fmt(slip.paye) }}</span></div>
              <div class="row-line" v-if="n(slip.uif)"><span>UIF</span><span>R{{ fmt(slip.uif) }}</span></div>
              <div class="row-line" v-if="n(slip.pension_fund)"><span>Pension Fund</span><span>R{{ fmt(slip.pension_fund) }}</span></div>
              <div class="row-line" v-if="n(slip.medical_aid)"><span>Medical Aid</span><span>R{{ fmt(slip.medical_aid) }}</span></div>
              <div class="row-line" v-if="n(slip.retirement_annuity)"><span>Retirement Annuity</span><span>R{{ fmt(slip.retirement_annuity) }}</span></div>
              <div class="row-line" v-if="n(slip.sdl)"><span>SDL / Prescribed Levy</span><span>R{{ fmt(slip.sdl) }}</span></div>
              <div class="row-line" v-if="n(slip.wellness_fund)"><span>Wellness Fund</span><span>R{{ fmt(slip.wellness_fund) }}</span></div>
              <div class="row-line" v-if="n(slip.union_fees)"><span>Union Fees</span><span>R{{ fmt(slip.union_fees) }}</span></div>
              <template v-if="slip.other_deductions?.length">
                <div class="row-line" v-for="(d, i) in slip.other_deductions" :key="'od'+i">
                  <span>{{ d.name }}</span><span>R{{ fmt(d.amount) }}</span>
                </div>
              </template>
              <div class="row-line text-bold" v-if="n(slip.total_deductions)">
                <span>Total Deductions</span><span class="text-red-8">R{{ fmt(slip.total_deductions) }}</span>
              </div>
              <q-separator class="q-my-sm" />

              <!-- Company Contributions -->
              <template v-if="n(slip.employer_pension) || n(slip.employer_uif) || n(slip.employer_oid)">
                <div class="text-subtitle2 text-blue-8 q-mb-xs">Company Contributions</div>
                <div class="row-line" v-if="n(slip.employer_pension)"><span>Employer Pension</span><span>R{{ fmt(slip.employer_pension) }}</span></div>
                <div class="row-line" v-if="n(slip.employer_uif)"><span>Employer UIF</span><span>R{{ fmt(slip.employer_uif) }}</span></div>
                <div class="row-line" v-if="n(slip.employer_oid)"><span>OID / COIDA</span><span>R{{ fmt(slip.employer_oid) }}</span></div>
                <q-separator class="q-my-sm" />
              </template>

              <!-- Employment Details -->
              <template v-if="slip.designation || slip.cost_centre || slip.hourly_rate || slip.normal_hours || slip.leave_days">
                <div class="text-subtitle2 text-grey-8 q-mb-xs">Employment Details</div>
                <div class="row-line" v-if="slip.designation"><span>Designation</span><span>{{ slip.designation }}</span></div>
                <div class="row-line" v-if="slip.cost_centre"><span>Cost Centre</span><span>{{ slip.cost_centre }}</span></div>
                <div class="row-line" v-if="slip.hourly_rate"><span>Hourly Rate</span><span>R{{ fmt(slip.hourly_rate) }}</span></div>
                <div class="row-line" v-if="slip.normal_hours"><span>Normal Hours</span><span>{{ slip.normal_hours }}</span></div>
                <div class="row-line" v-if="slip.leave_days"><span>Leave Days</span><span>{{ slip.leave_days }}</span></div>
                <q-separator class="q-my-sm" />
              </template>

              <!-- YTD Totals -->
              <template v-if="slip.ytd_gross || slip.ytd_paye || slip.ytd_pension || slip.ytd_medical_aid">
                <div class="text-subtitle2 text-purple-8 q-mb-xs">Year-to-Date</div>
                <div class="row-line" v-if="slip.ytd_gross"><span>Gross Remuneration</span><span>R{{ fmt(slip.ytd_gross) }}</span></div>
                <div class="row-line" v-if="slip.ytd_paye"><span>PAYE</span><span>R{{ fmt(slip.ytd_paye) }}</span></div>
                <div class="row-line" v-if="slip.ytd_pension"><span>Pension Fund</span><span>R{{ fmt(slip.ytd_pension) }}</span></div>
                <div class="row-line" v-if="slip.ytd_medical_aid"><span>Medical Aid</span><span>R{{ fmt(slip.ytd_medical_aid) }}</span></div>
              </template>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </q-list>
    </q-card>

    <!-- Empty state -->
    <q-card v-if="!payslips.length && !loading" class="q-mb-md">
      <q-card-section class="text-center q-pa-lg">
        <q-icon name="receipt_long" size="64px" color="grey-4" />
        <div class="text-h6 text-grey-6 q-mt-md">No payslips yet</div>
        <div class="text-body2 text-grey-5">Upload your first payslip above to get started</div>
      </q-card-section>
    </q-card>

    <!-- Employer & Tax Profile -->
    <q-expansion-item
      icon="badge"
      label="Employer & Tax Details"
      caption="Auto-filled from latest payslip — edit if needed"
      header-class="text-h6"
      class="q-mb-md"
      default-opened
    >
      <q-card>
        <q-card-section>
          <!-- Current salary snapshot (read-only, from profile) -->
          <div class="text-subtitle2 text-primary q-mb-xs">Current Salary Snapshot</div>
          <q-card flat class="bg-grey-1 q-mb-md" style="border-radius: 12px">
            <q-card-section class="q-pa-sm">
              <div class="row-line"><span>Gross Salary</span><span class="text-green-8 text-bold">R{{ fmt(profileFull.gross_salary) }}</span></div>
              <div class="row-line"><span>Net Salary</span><span class="text-blue-8 text-bold">R{{ fmt(profileFull.net_salary) }}</span></div>
              <q-separator class="q-my-xs" />
              <div class="row-line" v-if="n(profileFull.paye)"><span>PAYE</span><span>R{{ fmt(profileFull.paye) }}</span></div>
              <div class="row-line" v-if="n(profileFull.uif)"><span>UIF</span><span>R{{ fmt(profileFull.uif) }}</span></div>
              <div class="row-line" v-if="n(profileFull.pension_fund)"><span>Pension Fund</span><span>R{{ fmt(profileFull.pension_fund) }}</span></div>
              <div class="row-line" v-if="n(profileFull.medical_aid)"><span>Medical Aid</span><span>R{{ fmt(profileFull.medical_aid) }}</span></div>
              <div class="row-line" v-if="n(profileFull.retirement_annuity)"><span>Retirement Annuity</span><span>R{{ fmt(profileFull.retirement_annuity) }}</span></div>
              <div class="row-line" v-if="n(profileFull.travel_allowance)"><span>Travel Allowance</span><span>R{{ fmt(profileFull.travel_allowance) }}</span></div>
              <div class="row-line" v-if="n(profileFull.bonus)"><span>Bonus</span><span>R{{ fmt(profileFull.bonus) }}</span></div>
              <div class="row-line" v-if="n(profileFull.commission)"><span>Commission</span><span>R{{ fmt(profileFull.commission) }}</span></div>
              <div class="row-line" v-if="n(profileFull.overtime)"><span>Overtime</span><span>R{{ fmt(profileFull.overtime) }}</span></div>
            </q-card-section>
          </q-card>

          <!-- Editable identity / tax fields -->
          <div class="text-subtitle2 text-grey-8 q-mb-sm">Identity & Tax References</div>
          <q-form @submit="handleSaveProfile">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input v-model="profile.employer_name" label="Employer Name" outlined dense />
              </div>
              <div class="col-12 col-sm-6">
                <q-input v-model="profile.employer_tax_ref" label="Employer PAYE Ref" outlined dense />
              </div>
              <div class="col-12 col-sm-4">
                <q-input v-model="profile.employee_number" label="Employee Number" outlined dense />
              </div>
              <div class="col-12 col-sm-4">
                <q-input v-model="profile.tax_number" label="Tax Number" outlined dense />
              </div>
              <div class="col-12 col-sm-4">
                <q-input v-model="profile.id_number" label="ID Number" outlined dense maxlength="13" />
              </div>
              <div class="col-12 col-sm-4">
                <q-input v-model="profile.irp5_reference" label="IRP5 Reference" outlined dense />
              </div>
              <div class="col-12 col-sm-4">
                <q-input v-model.number="profile.medical_aid_members" label="Medical Aid Members" type="number" outlined dense min="0" />
              </div>
            </div>
            <div class="row justify-end q-mt-md">
              <q-btn type="submit" color="primary" label="Save Details" :loading="saving" unelevated />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-expansion-item>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { salaryProfileApi } from '@/services/api/salaryProfile.api';
import type { Payslip } from '@/types';

const $q = useQuasar();
const loading = ref(true);
const saving = ref(false);
const extracting = ref(false);
const payslipFile = ref<File | null>(null);
const payslips = ref<Payslip[]>([]);
const summary = ref({ total_gross: 0, total_net: 0, total_paye: 0, count: 0 });

const profile = ref({
  employer_name: '',
  employer_tax_ref: '',
  employee_number: '',
  tax_number: '',
  id_number: '',
  irp5_reference: '',
  medical_aid_members: 1,
});
const profileFull = ref({
  gross_salary: 0, net_salary: 0, paye: 0, uif: 0,
  medical_aid: 0, pension_fund: 0, retirement_annuity: 0,
  travel_allowance: 0, bonus: 0, commission: 0, overtime: 0,
});

function fmt(v: number | string): string {
  return Number(v).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function n(v: number | string | null | undefined): boolean {
  return v !== null && v !== undefined && Number(v) !== 0;
}

async function loadPayslips() {
  try {
    const res = await salaryProfileApi.listPayslips();
    payslips.value = res.data.data;
    summary.value = res.data.summary;
  } catch { /* empty */ }
}

async function loadProfile() {
  try {
    const res = await salaryProfileApi.get();
    const p = res.data.data;
    profile.value = {
      employer_name: p.employer_name || '',
      employer_tax_ref: p.employer_tax_ref || '',
      employee_number: p.employee_number || '',
      tax_number: p.tax_number || '',
      id_number: p.id_number || '',
      irp5_reference: p.irp5_reference || '',
      medical_aid_members: p.medical_aid_members || 1,
    };
    profileFull.value = {
      gross_salary: Number(p.gross_salary) || 0,
      net_salary: Number(p.net_salary) || 0,
      paye: Number(p.paye) || 0,
      uif: Number(p.uif) || 0,
      medical_aid: Number(p.medical_aid) || 0,
      pension_fund: Number(p.pension_fund) || 0,
      retirement_annuity: Number(p.retirement_annuity) || 0,
      travel_allowance: Number(p.travel_allowance) || 0,
      bonus: Number(p.bonus) || 0,
      commission: Number(p.commission) || 0,
      overtime: Number(p.overtime) || 0,
    };
  } catch { /* created on first save */ }
}

async function handlePayslipUpload(file: File | null) {
  if (!file) return;

  extracting.value = true;
  try {
    const res = await salaryProfileApi.extractPayslip(file);
    // Reload lists to show new payslip
    await loadPayslips();
    await loadProfile();
    $q.notify({ type: 'positive', message: res.data.message || 'Payslip extracted and saved' });
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      || 'Failed to extract payslip data';
    $q.notify({ type: 'negative', message: msg });
  } finally {
    extracting.value = false;
    payslipFile.value = null;
  }
}

async function handleSaveProfile() {
  saving.value = true;
  try {
    await salaryProfileApi.update(profile.value);
    $q.notify({ type: 'positive', message: 'Profile saved' });
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to save profile' });
  } finally {
    saving.value = false;
  }
}

function confirmDelete(slip: Payslip) {
  $q.dialog({
    title: 'Delete Payslip',
    message: `Delete payslip for ${slip.pay_period || 'this period'}?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await salaryProfileApi.deletePayslip(slip.id);
      await loadPayslips();
      $q.notify({ type: 'positive', message: 'Payslip deleted' });
    } catch {
      $q.notify({ type: 'negative', message: 'Failed to delete' });
    }
  });
}

onMounted(async () => {
  await Promise.all([loadPayslips(), loadProfile()]);
  loading.value = false;
});
</script>

<style scoped>
.row-line {
  display: flex;
  justify-content: space-between;
  padding: 2px 8px;
  font-size: 0.85rem;
}
.row-line:nth-child(even) {
  background: rgba(0,0,0,0.02);
}
</style>
