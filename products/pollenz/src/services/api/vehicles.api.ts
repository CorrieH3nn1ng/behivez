import apiClient from './client';

export interface Vehicle {
  id: string;
  user_id: string;
  name: string;
  type: 'owned' | 'rental';
  make: string | null;
  model: string | null;
  year: number | null;
  registration: string | null;
  purchase_price: number;
  purchase_date: string | null;
  is_default: boolean;
  is_active: boolean;
  fixed_cost_pa: number;
  fuel_cost_per_km: number;
  maintenance_cost_per_km: number;
  total_km_year: number;
  business_km_year: number;
  business_use_percent: number;
  opening_odometer: number;
  rental_start: string | null;
  rental_end: string | null;
  rental_total: number | null;
  trips_count: number;
  expenses_sum_amount: number;
  created_at: string;
  updated_at: string;
  calculation?: VehicleCalculation;
}

export interface VehicleCalculation {
  deemed_cost: number;
  annual_deduction: number;
  monthly_deduction: number;
  business_percent: number;
  fixed_cost_pa: number;
  fuel_cost_per_km: number;
  maintenance_cost_per_km: number;
}

export interface VehicleCreateData {
  name: string;
  type: 'owned' | 'rental';
  make?: string;
  model?: string;
  year?: number;
  registration?: string;
  purchase_price?: number;
  purchase_date?: string;
  opening_odometer?: number;
  rental_start?: string;
  rental_end?: string;
  rental_total?: number;
}

export const vehiclesApi = {
  list() {
    return apiClient.get<{ data: Vehicle[] }>('/vehicles');
  },

  show(id: string) {
    return apiClient.get<{ data: Vehicle }>(`/vehicles/${id}`);
  },

  create(data: VehicleCreateData) {
    return apiClient.post<{ data: Vehicle }>('/vehicles', data);
  },

  update(id: string, data: Partial<VehicleCreateData & { fixed_cost_pa: number; fuel_cost_per_km: number; maintenance_cost_per_km: number }>) {
    return apiClient.put<{ data: Vehicle }>(`/vehicles/${id}`, data);
  },

  destroy(id: string) {
    return apiClient.delete(`/vehicles/${id}`);
  },

  setDefault(id: string) {
    return apiClient.post<{ data: Vehicle }>(`/vehicles/${id}/set-default`);
  },

  syncKm(id: string) {
    return apiClient.post<{ data: Vehicle }>(`/vehicles/${id}/sync-km`);
  },

  bulkAssignTrips(vehicleId: string) {
    return apiClient.post<{ message: string; updated_count: number }>('/trips/bulk-assign-vehicle', {
      vehicle_id: vehicleId,
    });
  },

  uploadDocument(id: string, file: File, type: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return apiClient.post<{ path: string; url: string }>(`/vehicles/${id}/document`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
