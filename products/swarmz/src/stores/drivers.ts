import { defineStore } from 'pinia';
import { api } from 'boot/axios';
import type { Driver } from 'src/types';

const MOCK_DRIVERS: Driver[] = [
  { id: 'd1', name: 'Sipho Ndlovu', email: 'sipho@example.com', phone: '072 345 6789', assignedVehicleIds: ['v2'], inviteStatus: 'accepted', createdAt: '2026-01-15T08:00:00Z' },
  { id: 'd2', name: 'Thandi Mokoena', email: 'thandi@example.com', assignedVehicleIds: [], inviteStatus: 'pending', createdAt: '2026-03-10T12:00:00Z' },
];

function isDemo() {
  return localStorage.getItem('accessToken') === 'demo-token';
}

interface DriversState {
  drivers: Driver[];
  isLoading: boolean;
}

export const useDriversStore = defineStore('drivers', {
  state: (): DriversState => ({
    drivers: [],
    isLoading: false,
  }),

  getters: {
    activeDrivers: (state) => state.drivers.filter(d => d.inviteStatus === 'accepted'),
    driverForVehicle: (state) => (vehicleId: string) =>
      state.drivers.find(d => d.assignedVehicleIds.includes(vehicleId)),
  },

  actions: {
    async fetchDrivers() {
      this.isLoading = true;
      try {
        if (isDemo()) {
          this.drivers = [...MOCK_DRIVERS];
          return;
        }
        const response = await api.get('/drivers');
        this.drivers = response.data;
      } catch (error) {
        console.error('Failed to fetch drivers:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async inviteDriver(name: string, email: string) {
      if (isDemo()) {
        const driver: Driver = {
          id: 'd' + Date.now(),
          name, email,
          assignedVehicleIds: [],
          inviteStatus: 'pending',
          createdAt: new Date().toISOString(),
        };
        this.drivers.push(driver);
        return;
      }
      const response = await api.post('/drivers', { name, email });
      this.drivers.push(response.data);
    },

    async removeDriver(id: string) {
      if (!isDemo()) {
        await api.delete(`/drivers/${id}`);
      }
      this.drivers = this.drivers.filter(d => d.id !== id);
    },

    async assignVehicle(driverId: string, vehicleId: string) {
      if (!isDemo()) {
        await api.post(`/drivers/${driverId}/assign`, { vehicleId });
      }
      const driver = this.drivers.find(d => d.id === driverId);
      if (driver && !driver.assignedVehicleIds.includes(vehicleId)) {
        driver.assignedVehicleIds.push(vehicleId);
      }
    },

    async unassignVehicle(driverId: string, vehicleId: string) {
      if (!isDemo()) {
        await api.delete(`/drivers/${driverId}/assign/${vehicleId}`);
      }
      const driver = this.drivers.find(d => d.id === driverId);
      if (driver) {
        driver.assignedVehicleIds = driver.assignedVehicleIds.filter(id => id !== vehicleId);
      }
    },
  },
});
