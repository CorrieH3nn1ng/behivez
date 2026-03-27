import { defineStore } from 'pinia';
import { api } from 'boot/axios';
import type { Vehicle, VehicleStatus } from 'src/types';

const MOCK_VEHICLES: Vehicle[] = [
  { id: 'v1', registration: 'CA 456-789', make: 'Toyota', model: 'Hilux 2.4 GD-6', year: 2022, color: 'White', photoUrl: null, currentStatus: 'available', odometer: 87340, monthlySpend: 4850, createdAt: '2025-06-15T08:00:00Z' },
  { id: 'v2', registration: 'CF 123-GP', make: 'Volkswagen', model: 'Polo Vivo', year: 2021, color: 'Silver', photoUrl: null, currentStatus: 'out', odometer: 112500, monthlySpend: 3200, assignedDriverId: 'd1', createdAt: '2025-08-20T10:00:00Z' },
  { id: 'v3', registration: 'ND 987-654', make: 'Ford', model: 'Ranger 2.0 XLT', year: 2023, color: 'Blue', photoUrl: null, currentStatus: 'service', odometer: 45200, monthlySpend: 2100, createdAt: '2026-01-10T14:00:00Z' },
  { id: 'v4', registration: 'GP 246-WKL', make: 'Hyundai', model: 'Staria', year: 2024, color: 'Black', photoUrl: null, currentStatus: 'fueling', odometer: 18900, monthlySpend: 5600, createdAt: '2026-02-01T09:00:00Z' },
];

function isDemo() {
  return localStorage.getItem('sz_access_token') === 'demo-token';
}

interface VehiclesState {
  vehicles: Vehicle[];
  isLoading: boolean;
  searchQuery: string;
}

export const useVehiclesStore = defineStore('vehicles', {
  state: (): VehiclesState => ({
    vehicles: [],
    isLoading: false,
    searchQuery: '',
  }),

  getters: {
    filteredVehicles: (state) => {
      if (!state.searchQuery) return state.vehicles;
      const q = state.searchQuery.toLowerCase();
      return state.vehicles.filter(v =>
        v.registration.toLowerCase().includes(q) ||
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q)
      );
    },
    totalMonthlySpend: (state) => state.vehicles.reduce((sum, v) => sum + (v.monthlySpend || 0), 0),
    vehicleCount: (state) => state.vehicles.length,
  },

  actions: {
    async fetchVehicles() {
      this.isLoading = true;
      try {
        if (isDemo()) {
          this.vehicles = [...MOCK_VEHICLES];
          return;
        }
        const response = await api.get('/vehicles');
        this.vehicles = response.data.map((v: Vehicle) => ({
          ...v,
          monthlySpend: 0,
        }));
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
      } finally {
        this.isLoading = false;
      }
    },

    getVehicleById(id: string): Vehicle | undefined {
      return this.vehicles.find(v => v.id === id);
    },

    async addVehicle(data: Omit<Vehicle, 'id' | 'createdAt' | 'monthlySpend' | 'currentStatus'>) {
      if (isDemo()) {
        const vehicle: Vehicle = {
          ...data,
          id: 'v' + Date.now(),
          currentStatus: 'available',
          monthlySpend: 0,
          createdAt: new Date().toISOString(),
        };
        this.vehicles.push(vehicle);
        return vehicle;
      }
      const response = await api.post('/vehicles', data);
      const vehicle = { ...response.data, monthlySpend: 0 };
      this.vehicles.unshift(vehicle);
      return vehicle;
    },

    async updateStatus(vehicleId: string, status: VehicleStatus, odometer?: number) {
      const vehicle = this.vehicles.find(v => v.id === vehicleId);
      if (vehicle) {
        vehicle.currentStatus = status;
        if (odometer) vehicle.odometer = odometer;
      }
    },

    async deleteVehicle(id: string) {
      if (!isDemo()) {
        await api.delete(`/vehicles/${id}`);
      }
      this.vehicles = this.vehicles.filter(v => v.id !== id);
    },
  },
});
