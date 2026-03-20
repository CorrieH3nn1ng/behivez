<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Import Bank Statement</div>

    <!-- File Upload -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <q-file
          v-model="file"
          label="Select bank statement file"
          accept=".csv,.xlsx,.xls"
          outlined
          :disable="importing"
          @update:model-value="onFileSelected"
        >
          <template v-slot:prepend>
            <q-icon name="upload_file" />
          </template>
        </q-file>
        <div class="text-caption text-grey q-mt-xs">
          Supported formats: Nedbank CSV, Excel (.xlsx/.xls)
        </div>
      </q-card-section>
    </q-card>

    <!-- Parse Error -->
    <q-banner v-if="parseError" class="bg-negative text-white q-mb-md" rounded>
      <template v-slot:avatar><q-icon name="error" /></template>
      {{ parseError }}
    </q-banner>

    <!-- Parsed Preview -->
    <template v-if="parseResult && !parseError">
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-subtitle1 text-weight-bold q-mb-sm">Preview</div>

          <!-- Stats -->
          <div class="row q-col-gutter-sm q-mb-md">
            <div class="col-4 text-center">
              <div class="text-h6 text-primary">{{ parseResult.stats.parsedRows }}</div>
              <div class="text-caption text-grey">Transactions</div>
            </div>
            <div class="col-4 text-center">
              <div class="text-h6 text-grey">{{ parseResult.stats.skippedRows }}</div>
              <div class="text-caption text-grey">Skipped</div>
            </div>
            <div class="col-4 text-center">
              <div class="text-h6" :class="parseResult.errors.length ? 'text-negative' : 'text-positive'">
                {{ parseResult.errors.length }}
              </div>
              <div class="text-caption text-grey">Errors</div>
            </div>
          </div>

          <!-- Date Range -->
          <div v-if="parseResult.stats.dateRange" class="text-caption text-grey q-mb-sm">
            Date range: {{ parseResult.stats.dateRange.start }} to {{ parseResult.stats.dateRange.end }}
          </div>

          <!-- Preview Table (first 5) -->
          <q-markup-table flat bordered dense separator="cell" class="q-mb-sm">
            <thead>
              <tr>
                <th class="text-left">Date</th>
                <th class="text-left">Description</th>
                <th class="text-right">Amount</th>
                <th class="text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(tx, i) in previewTransactions" :key="i">
                <td>{{ tx.transactionDate }}</td>
                <td class="text-truncate" style="max-width: 200px">{{ tx.description }}</td>
                <td class="text-right" :class="tx.amount < 0 ? 'text-negative' : 'text-positive'">
                  {{ formatAmount(tx.amount) }}
                </td>
                <td class="text-right text-grey">{{ tx.balanceAfter != null ? formatAmount(tx.balanceAfter) : '-' }}</td>
              </tr>
            </tbody>
          </q-markup-table>
          <div v-if="parseResult.transactions.length > 5" class="text-caption text-grey">
            ... and {{ parseResult.transactions.length - 5 }} more transactions
          </div>
        </q-card-section>

        <!-- Import Button -->
        <q-card-actions align="right">
          <q-btn
            flat
            label="Cancel"
            @click="reset"
            :disable="importing"
          />
          <q-btn
            unelevated
            color="primary"
            icon="cloud_upload"
            :label="`Import ${parseResult.stats.parsedRows} Transactions`"
            :loading="importing"
            :disable="parseResult.stats.parsedRows === 0"
            @click="doImport"
          />
        </q-card-actions>
      </q-card>
    </template>

    <!-- Import Result -->
    <q-card v-if="importResult" flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold text-positive q-mb-sm">
          <q-icon name="check_circle" class="q-mr-xs" />
          Import Complete
        </div>
        <div class="row q-col-gutter-sm">
          <div class="col-6 text-center">
            <div class="text-h6 text-positive">{{ importResult.created }}</div>
            <div class="text-caption">Imported</div>
          </div>
          <div class="col-6 text-center">
            <div class="text-h6 text-warning">{{ importResult.skipped }}</div>
            <div class="text-caption">Duplicates Skipped</div>
          </div>
        </div>
      </q-card-section>
      <q-card-actions v-if="importResult.skipped > 0">
        <q-btn flat label="View Skipped" icon="info" size="sm" @click="showSkipped = true" />
      </q-card-actions>
    </q-card>

    <!-- Skipped Rows Dialog -->
    <q-dialog v-model="showSkipped" maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card>
        <q-toolbar class="bg-primary text-white">
          <q-toolbar-title>Skipped Records</q-toolbar-title>
          <q-btn flat round icon="close" v-close-popup />
        </q-toolbar>
        <q-card-section class="q-pa-none">
          <q-list separator>
            <q-item v-for="(row, i) in importResult?.skipped_rows" :key="i">
              <q-item-section avatar>
                <q-icon name="skip_next" color="warning" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Row {{ row.row + 1 }}</q-item-label>
                <q-item-label caption>{{ row.reason }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { NedbankParser } from '@/services/parsers/NedbankParser';
import { transactionsApi, type BulkStoreResult, type BulkStorePayload } from '@/services/api/transactions.api';
import type { ParseResult } from '@/types';

const $q = useQuasar();

const file = ref<File | null>(null);
const parseResult = ref<ParseResult | null>(null);
const parseError = ref<string | null>(null);
const importing = ref(false);
const importResult = ref<BulkStoreResult | null>(null);
const showSkipped = ref(false);

const previewTransactions = computed(() =>
  parseResult.value?.transactions.slice(0, 5) ?? []
);

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
}

async function onFileSelected(f: File | null) {
  parseResult.value = null;
  parseError.value = null;
  importResult.value = null;

  if (!f) return;

  try {
    const parser = new NedbankParser();
    const result = await parser.parseFile(f);

    if (result.transactions.length === 0 && result.errors.length > 0) {
      parseError.value = `Failed to parse file: ${result.errors[0].message}`;
      return;
    }

    if (result.transactions.length === 0) {
      parseError.value = 'No transactions found in file. Make sure you selected a valid bank statement.';
      return;
    }

    parseResult.value = result;
  } catch (err) {
    parseError.value = err instanceof Error ? err.message : 'Failed to parse file';
  }
}

async function doImport() {
  if (!parseResult.value) return;

  importing.value = true;
  try {
    const payload: BulkStorePayload[] = parseResult.value.transactions.map((tx) => ({
      transaction_date: tx.transactionDate,
      description: tx.description,
      amount: tx.amount,
      balance_after: tx.balanceAfter,
      bank_reference: tx.bankReference,
      raw_description: tx.rawDescription,
      import_source: tx.importSource,
    }));

    const { data } = await transactionsApi.bulkStore(payload);
    importResult.value = data;
    parseResult.value = null;
    file.value = null;

    $q.notify({
      type: 'positive',
      message: `Imported ${data.created} transactions${data.skipped ? `, ${data.skipped} duplicates skipped` : ''}`,
    });
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Import failed',
    });
  } finally {
    importing.value = false;
  }
}

function reset() {
  file.value = null;
  parseResult.value = null;
  parseError.value = null;
  importResult.value = null;
}
</script>
