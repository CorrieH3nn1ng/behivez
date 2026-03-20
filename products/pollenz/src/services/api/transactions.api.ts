import apiClient from './client';

export interface DashboardSummary {
  tax_year: number;
  tax_year_label: string;
  period: { start: string; end: string };
  available_tax_years: number[];
  income: {
    transaction_total: number;
    transaction_count: number;
    invoiced: number;
    paid: number;
    outstanding: number;
    invoice_count: number;
  };
  expenses: {
    transaction_total: number;
    transaction_count: number;
    vendor_invoice_total: number;
    vendor_invoice_count: number;
    pending_review: number;
    needs_extraction: number;
    tax_deductible: number;
  };
  net_position: number;
  expense_categories: CategoryBreakdown[];
  income_categories: CategoryBreakdown[];
}

export interface CategoryBreakdown {
  category_id: string | null;
  category_name: string | null;
  icon: string | null;
  color: string | null;
  is_tax_deductible: boolean;
  count: number;
  total: number;
}

export interface BulkStorePayload {
  transaction_date: string;
  description: string;
  amount: number;
  balance_after?: number | null;
  bank_reference?: string | null;
  raw_description?: string;
  import_source?: string;
}

export interface BulkStoreResult {
  created: number;
  skipped: number;
  skipped_rows: Array<{ row: number; reason: string }>;
  ids: string[];
}

export const transactionsApi = {
  summary(taxYear?: number) {
    const params = taxYear ? { tax_year: taxYear } : {};
    return apiClient.get<DashboardSummary>('/transactions/summary', { params });
  },

  list(params?: { tax_year?: number; category_id?: string }) {
    return apiClient.get<{ data: unknown[] }>('/transactions', { params });
  },

  bulkStore(transactions: BulkStorePayload[]) {
    return apiClient.post<BulkStoreResult>('/transactions/bulk-store', { transactions });
  },
};
