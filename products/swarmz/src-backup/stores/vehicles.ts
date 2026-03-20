import { defineStore } from 'pinia';
import { api } from 'boot/axios';

export type VehicleStatus =
  | 'READY'
  | 'OUT'
  | 'RETURNED'
  | 'CLEANING'
  | 'WORKSHOP'
  | 'MAINTENANCE'
  | 'TRANSFERRED'
  | 'INACTIVE';

export interface Vehicle {
  id: string;
  registration: string;
  make: string;
  model: string;
  year: number;
  color: string;
  categoryId: string;
  categoryName: string;
  status: VehicleStatus;
  branchId: string;
  branchName: string;
  odometer: number;
  fuelLevel: number;
  lastInspectionDate: string | null;
  imageUrl: string | null;
}

interface VehiclesState {
  vehicles: Vehicle[];
  currentVehicle: Vehicle | null;
  isLoading: boolean;
  filters: {
    status: VehicleStatus | null;
    categoryId: string | null;
    branchId: string | null;
    search: string;
  };
}

export const useVehiclesStore = defineStore('vehicles', {
  state: (): VehiclesState => ({
    vehicles: [],
    currentVehicle: null,
    isLoading: false,
    filters: {
      status: null,
      categoryId: null,
      branchId: null,
      search: '',
    },
  }),

  getters: {
    filteredVehicles: (state) => {
      return state.vehicles.filter((v) => {
        if (state.filters.status && v.status !== state.filters.status) return false;
        if (state.filters.categoryId && v.categoryId !== state.filters.categoryId) return false;
        if (state.filters.branchId && v.branchId !== state.filters.branchId) return false;
        if (state.filters.search) {
          const search = state.filters.search.toLowerCase();
          return (
            v.registration.toLowerCase().includes(search) ||
            v.make.toLowerCase().includes(search) ||
            v.model.toLowerCase().includes(search)
          );
        }
        return true;
      });
    },

    vehiclesByStatus: (state) => {
      const grouped: Record<VehicleStatus, Vehicle[]> = {
        READY: [],
        OUT: [],
        RETURNED: [],
        CLEANING: [],
        WORKSHOP: [],
        MAINTENANCE: [],
        TRANSFERRED: [],
        INACTIVE: [],
      };

      state.vehicles.forEach((v) => {
        grouped[v.status].push(v);
      });

      return grouped;
    },

    availableVehicles: (state) => state.vehicles.filter((v) => v.status === 'READY'),
  },

  actions: {
    async fetchVehicles() {
      this.isLoading = true;
      try {
        const response = await api.get('/vehicles');
        this.vehicles = response.data;
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchVehicle(id: string) {
      this.isLoading = true;
      try {
        const response = await api.get(`/vehicles/${id}`);
        this.currentVehicle = response.data;
        return response.data;
      } catch (error) {
        console.error('Failed to fetch vehicle:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async updateVehicleStatus(id: string, status: VehicleStatus, notes?: string) {
      try {
        const response = await api.patch(`/vehicles/${id}/status`, { status, notes });
        const index = this.vehicles.findIndex((v) => v.id === id);
        if (index !== -1) {
          this.vehicles[index] = response.data;
        }
        if (this.currentVehicle?.id === id) {
          this.currentVehicle = response.data;
        }
        return response.data;
      } catch (error) {
        console.error('Failed to update vehicle status:', error);
        throw error;
      }
    },

    setFilters(filters: Partial<VehiclesState['filters']>) {
      this.filters = { ...this.filters, ...filters };
    },

    clearFilters() {
      this.filters = {
        status: null,
        categoryId: null,
        branchId: null,
        search: '',
      };
    },
  },
});
