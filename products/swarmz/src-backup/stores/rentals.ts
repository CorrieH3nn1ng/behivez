import { defineStore } from 'pinia';
import { api } from 'boot/axios';

export type RentalStatus = 'RESERVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Rental {
  id: string;
  bookingRef: string;
  status: RentalStatus;
  customerId: string;
  customerName: string;
  vehicleId: string | null;
  vehicleRegistration: string | null;
  vehicleDescription: string | null;
  categoryId: string;
  categoryName: string;
  branchId: string;
  branchName: string;
  startDate: string;
  endDate: string;
  actualStartDate: string | null;
  actualEndDate: string | null;
  checkoutOdometer: number | null;
  returnOdometer: number | null;
  checkoutFuel: number | null;
  returnFuel: number | null;
  checkoutInspectionId: string | null;
  returnInspectionId: string | null;
  hasDamage: boolean;
  createdAt: string;
}

interface RentalsState {
  rentals: Rental[];
  currentRental: Rental | null;
  isLoading: boolean;
  filters: {
    status: RentalStatus | null;
    branchId: string | null;
    search: string;
    dateFrom: string | null;
    dateTo: string | null;
  };
}

export const useRentalsStore = defineStore('rentals', {
  state: (): RentalsState => ({
    rentals: [],
    currentRental: null,
    isLoading: false,
    filters: {
      status: null,
      branchId: null,
      search: '',
      dateFrom: null,
      dateTo: null,
    },
  }),

  getters: {
    filteredRentals: (state) => {
      return state.rentals.filter((r) => {
        if (state.filters.status && r.status !== state.filters.status) return false;
        if (state.filters.branchId && r.branchId !== state.filters.branchId) return false;
        if (state.filters.search) {
          const search = state.filters.search.toLowerCase();
          return (
            r.bookingRef.toLowerCase().includes(search) ||
            r.customerName.toLowerCase().includes(search) ||
            r.vehicleRegistration?.toLowerCase().includes(search)
          );
        }
        return true;
      });
    },

    activeRentals: (state) => state.rentals.filter((r) => r.status === 'ACTIVE'),
    todayReturns: (state) => {
      const today = new Date().toISOString().split('T')[0];
      return state.rentals.filter(
        (r) => r.status === 'ACTIVE' && r.endDate.startsWith(today)
      );
    },
  },

  actions: {
    async fetchRentals() {
      this.isLoading = true;
      try {
        const response = await api.get('/rentals');
        this.rentals = response.data;
      } catch (error) {
        console.error('Failed to fetch rentals:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchRental(id: string) {
      this.isLoading = true;
      try {
        const response = await api.get(`/rentals/${id}`);
        this.currentRental = response.data;
        return response.data;
      } catch (error) {
        console.error('Failed to fetch rental:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async findByBookingRef(bookingRef: string) {
      this.isLoading = true;
      try {
        const response = await api.get(`/rentals/booking/${bookingRef}`);
        this.currentRental = response.data;
        return response.data;
      } catch (error) {
        console.error('Failed to find rental:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async checkout(data: {
      rentalId: string;
      vehicleId: string;
      odometer: number;
      fuelLevel: number;
      inspectionId: string;
      customerSignature: string;
    }) {
      try {
        const response = await api.post(`/rentals/${data.rentalId}/checkout`, data);
        const index = this.rentals.findIndex((r) => r.id === data.rentalId);
        if (index !== -1) {
          this.rentals[index] = response.data;
        }
        this.currentRental = response.data;
        return response.data;
      } catch (error) {
        console.error('Failed to checkout:', error);
        throw error;
      }
    },

    async processReturn(data: {
      rentalId: string;
      odometer: number;
      fuelLevel: number;
      inspectionId: string;
      customerSignature: string;
    }) {
      try {
        const response = await api.patch(`/rentals/${data.rentalId}/return`, data);
        const index = this.rentals.findIndex((r) => r.id === data.rentalId);
        if (index !== -1) {
          this.rentals[index] = response.data;
        }
        this.currentRental = response.data;
        return response.data;
      } catch (error) {
        console.error('Failed to process return:', error);
        throw error;
      }
    },

    setFilters(filters: Partial<RentalsState['filters']>) {
      this.filters = { ...this.filters, ...filters };
    },

    clearFilters() {
      this.filters = {
        status: null,
        branchId: null,
        search: '',
        dateFrom: null,
        dateTo: null,
      };
    },
  },
});
