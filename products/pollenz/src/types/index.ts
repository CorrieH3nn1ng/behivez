// === Auth ===
export type UserRole = 'admin' | 'user';
export type ProfileType = 'freelancer' | 'salary' | null;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profile_type: ProfileType;
  phone: string | null;
  date_of_birth: string | null;
  id_number: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string;
  preferred_language: string;
  avatar_path: string | null;
  created_at: string;
}

// === Business Profile ===
export interface BusinessProfile {
  id: string;
  user_id: string;
  business_name: string | null;
  account_holder: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  bank_name: string | null;
  account_number: string | null;
  account_type: string | null;
  branch_code: string | null;
  payment_terms: string | null;
  logo_path: string | null;
  tax_number: string | null;
  vat_number: string | null;
  id_number: string | null;
  tax_reference: string | null;
  registration_number: string | null;
  trading_as: string | null;
  business_type: string | null;
  industry: string | null;
  website: string | null;
  default_currency: string;
  invoice_footer: string | null;
  default_tax_rate: string;
}

// === Clients ===
export interface Client {
  id: string;
  user_id: string;
  name: string;
  client_code: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  invoices_count?: number;
  created_at: string;
}

// === Shared ===
export type EntryCategory = 'business' | 'private';

// === Invoices (Income) ===
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  description: string;
  quantity: number;
  unit: string | null;
  unit_price: number;
  amount: number;
  sort_order: number;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string;
  invoice_number: string;
  sequence_number: number;
  status: InvoiceStatus;
  category: EntryCategory;
  invoice_date: string;
  due_date: string;
  paid_date: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  title: string | null;
  notes: string | null;
  client: Client;
  items: InvoiceItem[];
  documents?: Document[];
  created_at: string;
}

export interface InvoiceSummary {
  total_invoiced: number;
  total_paid: number;
  total_outstanding: number;
  count: number;
}

// === Vendor Invoices ===
export type VendorInvoiceStatus = 'pending' | 'reviewed' | 'approved' | 'rejected';

export interface VendorLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface VendorInvoice {
  id: string;
  user_id: string;
  vendor_name: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  subtotal: number | null;
  tax_rate: number | null;
  tax_amount: number | null;
  total: number | null;
  currency: string;
  line_items: VendorLineItem[] | null;
  raw_extraction: Record<string, unknown> | null;
  confidence: number | null;
  status: VendorInvoiceStatus;
  category: EntryCategory;
  notes: string | null;
  documents?: Document[];
  created_at: string;
}

// === Salary Profile ===
export interface SalaryProfile {
  id: string;
  user_id: string;
  employer_name: string | null;
  employer_tax_ref: string | null;
  employee_number: string | null;
  tax_number: string | null;
  id_number: string | null;
  gross_salary: number;
  net_salary: number;
  paye: number;
  uif: number;
  medical_aid: number;
  medical_aid_members: number;
  pension_fund: number;
  retirement_annuity: number;
  travel_allowance: number;
  bonus: number;
  commission: number;
  overtime: number;
  irp5_reference: string | null;
  pay_period: string | null;
  notes: string | null;
  created_at: string;
}

export interface PayslipExtraction {
  employer_name?: string | null;
  employer_tax_ref?: string | null;
  employee_number?: string | null;
  tax_number?: string | null;
  id_number?: string | null;
  gross_salary?: number | null;
  net_salary?: number | null;
  paye?: number | null;
  uif?: number | null;
  medical_aid?: number | null;
  medical_aid_members?: number | null;
  pension_fund?: number | null;
  retirement_annuity?: number | null;
  travel_allowance?: number | null;
  bonus?: number | null;
  commission?: number | null;
  overtime?: number | null;
  irp5_reference?: string | null;
  pay_period?: string | null;
  notes?: string | null;
}

// === Payslips (Monthly History) ===
export interface NameAmountPair {
  name: string;
  amount: number;
}

export interface Payslip {
  id: string;
  user_id: string;
  pay_period: string | null;
  pay_date: string | null;
  employer_name: string | null;
  designation: string | null;
  cost_centre: string | null;
  hourly_rate: number | null;
  normal_hours: number | null;
  leave_days: number | null;
  gross_salary: number;
  net_salary: number;
  paye: number;
  uif: number;
  medical_aid: number;
  pension_fund: number;
  retirement_annuity: number;
  travel_allowance: number;
  bonus: number;
  commission: number;
  overtime: number;
  sdl: number;
  wellness_fund: number;
  union_fees: number;
  other_deductions: NameAmountPair[] | null;
  employer_pension: number;
  employer_uif: number;
  employer_oid: number;
  other_earnings: NameAmountPair[] | null;
  total_deductions: number;
  ytd_gross: number | null;
  ytd_paye: number | null;
  ytd_pension: number | null;
  ytd_medical_aid: number | null;
  notes: string | null;
  created_at: string;
}

// === Documents ===
export interface Document {
  id: string;
  user_id: string;
  documentable_type: string;
  documentable_id: string;
  filename: string;
  disk_path: string;
  mime_type: string;
  size: number;
}

// === Bank Statement Import ===
export interface ParsedTransaction {
  transactionDate: string;
  description: string;
  amount: number;
  balanceAfter: number | null;
  bankReference: string | null;
  rawDescription: string;
  importSource: string;
}

export interface ParseError {
  row: number;
  field: string;
  message: string;
  rawValue: unknown;
}

export interface ParseResult {
  success: boolean;
  transactions: ParsedTransaction[];
  errors: ParseError[];
  warnings: string[];
  stats: {
    totalRows: number;
    parsedRows: number;
    skippedRows: number;
    dateRange: { start: string; end: string } | null;
  };
}

// === API Responses ===
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiListResponse<T> {
  data: T[];
  summary?: Record<string, unknown>;
}
