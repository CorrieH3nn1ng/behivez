import apiClient from './client';

export interface VehicleExpense {
  id: string;
  user_id: string;
  vehicle_id: string;
  vehicle?: { id: string; name: string; type: string };
  date: string;
  category: string;
  amount: number;
  vendor: string | null;
  description: string | null;
  litres: number | null;
  price_per_litre: number | null;
  odometer_km: number | null;
  raw_extraction: Record<string, unknown> | null;
  source: 'manual' | 'ai_extracted';
  receipt_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleExpenseCreateData {
  vehicle_id: string;
  date: string;
  category: string;
  amount: number;
  vendor?: string;
  description?: string;
  litres?: number;
  price_per_litre?: number;
  odometer_km?: number;
}

export interface ExpenseSummary {
  grand_total: number;
  by_category: Record<string, { total: number; count: number }>;
  by_vehicle: Array<{
    vehicle_id: string;
    vehicle_name: string;
    vehicle_type: string;
    total: number;
    count: number;
  }>;
}

export const EXPENSE_CATEGORIES = [
  'Fuel', 'Service', 'Tyres', 'Insurance', 'Toll', 'Licence', 'Parking', 'Other',
] as const;

export const vehicleExpensesApi = {
  list(filters?: { vehicle_id?: string; category?: string; date_from?: string; date_to?: string }) {
    return apiClient.get<{ data: VehicleExpense[] }>('/vehicle-expenses', { params: filters });
  },

  create(data: VehicleExpenseCreateData) {
    return apiClient.post<{ data: VehicleExpense }>('/vehicle-expenses', data);
  },

  upload(vehicleId: string, file: File) {
    const formData = new FormData();
    formData.append('vehicle_id', vehicleId);
    formData.append('file', file);
    return apiClient.post<{ data: VehicleExpense; receipt_url: string }>('/vehicle-expenses/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  update(id: string, data: Partial<VehicleExpenseCreateData>) {
    return apiClient.put<{ data: VehicleExpense }>(`/vehicle-expenses/${id}`, data);
  },

  destroy(id: string) {
    return apiClient.delete(`/vehicle-expenses/${id}`);
  },

  summary(vehicleId?: string) {
    const params = vehicleId ? { vehicle_id: vehicleId } : {};
    return apiClient.get<ExpenseSummary>('/vehicle-expenses/summary', { params });
  },
};
