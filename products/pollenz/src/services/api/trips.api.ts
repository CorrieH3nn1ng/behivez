import apiClient from './client';

export interface Trip {
  id: number;
  date: string;
  start_time: string | null;
  end_time: string | null;
  origin: string;
  destination: string;
  distance_km: number;
  odometer_start: number | null;
  odometer_end: number | null;
  vehicle_id: string | null;
  purpose: string | null;
  category: 'Business' | 'Private';
  is_business: boolean;
  is_mirror: boolean;
  source: string;
}

export interface TripSummary {
  total_trips: number;
  total_km: number;
  business_km: number;
  business_trips: number;
  private_km: number;
}

export interface TravelSummary {
  total_trips: number;
  total_km: number;
  business: { trips: number; km: number };
  private: { trips: number; km: number };
  business_use_percent: number;
  vehicle_deduction: {
    purchase_price: number;
    fixed_cost_pa: number;
    annual_deduction: number;
    monthly_deduction: number;
    method: string;
  } | null;
  date_range: { first: string | null; last: string | null };
}

export const tripsApi = {
  list(params?: { category?: string; tax_year?: number; vehicle_id?: string }) {
    return apiClient.get<{ data: Trip[]; summary: TripSummary }>('/trips', { params });
  },

  summary(taxYear?: number) {
    const params = taxYear ? { tax_year: taxYear } : {};
    return apiClient.get<TravelSummary>('/trips/summary', { params });
  },

  create(data: {
    date: string;
    origin: string;
    destination: string;
    distance_km: number;
    odometer_start?: number;
    odometer_end?: number;
    vehicle_id?: string;
    purpose?: string;
    category: 'Business' | 'Private';
    start_time?: string;
    end_time?: string;
  }) {
    return apiClient.post<{ data: Trip }>('/trips', data);
  },

  update(id: number, data: Partial<Trip>) {
    return apiClient.put<{ data: Trip }>(`/trips/${id}`, data);
  },

  delete(id: number) {
    return apiClient.delete(`/trips/${id}`);
  },
};
