import { defineStore } from 'pinia';
import { api } from 'boot/axios';
import type { StatusLogEntry, CostCategory } from 'src/types';

const today = new Date();
const daysAgo = (n: number) => new Date(today.getTime() - n * 86400000).toISOString();

const MOCK_ENTRIES: StatusLogEntry[] = [
  { id: 'e1', vehicleId: 'v1', status: 'fueling', timestamp: daysAgo(1), odometer: 87340, costAmount: 987.50, costCategory: 'fuel', vendor: 'Shell Sandton', notes: '52.3L Diesel 50ppm', receiptPhotos: ['mock-receipt-1'] },
  { id: 'e2', vehicleId: 'v1', status: 'cleaning', timestamp: daysAgo(3), costAmount: 150, costCategory: 'cleaning', vendor: 'Quick Wash Rivonia', receiptPhotos: [] },
  { id: 'e3', vehicleId: 'v1', status: 'fueling', timestamp: daysAgo(8), odometer: 86890, costAmount: 1050, costCategory: 'fuel', vendor: 'Engen N1', notes: '55.8L Diesel', receiptPhotos: ['mock-receipt-3'] },
  { id: 'e4', vehicleId: 'v1', status: 'service', timestamp: daysAgo(15), odometer: 85000, costAmount: 2650, costCategory: 'service', vendor: 'Toyota Bryanston', notes: '85,000km major service', receiptPhotos: ['mock-receipt-4'] },
  { id: 'e5', vehicleId: 'v2', status: 'fueling', timestamp: daysAgo(2), odometer: 112500, costAmount: 745, costCategory: 'fuel', vendor: 'Sasol Midrand', notes: '42L Unleaded 95', receiptPhotos: ['mock-receipt-5'] },
  { id: 'e6', vehicleId: 'v2', status: 'out', timestamp: daysAgo(2), odometer: 112480, notes: 'Sipho — Uber shift', receiptPhotos: [] },
  { id: 'e7', vehicleId: 'v2', status: 'repair', timestamp: daysAgo(10), costAmount: 1850, costCategory: 'repair', vendor: 'AutoZone Randburg', notes: 'Replace alternator belt', receiptPhotos: ['mock-receipt-7'] },
  { id: 'e8', vehicleId: 'v2', status: 'fueling', timestamp: daysAgo(12), odometer: 111800, costAmount: 610, costCategory: 'fuel', vendor: 'BP Fourways', notes: '34L Unleaded', receiptPhotos: [] },
  { id: 'e9', vehicleId: 'v3', status: 'service', timestamp: daysAgo(0), odometer: 45200, costAmount: 2100, costCategory: 'service', vendor: 'Ford Menlyn', notes: '45,000km service', receiptPhotos: ['mock-receipt-9'] },
  { id: 'e10', vehicleId: 'v4', status: 'fueling', timestamp: daysAgo(0), odometer: 18900, costAmount: 1240, costCategory: 'fuel', vendor: 'Shell OR Tambo', notes: '65L Diesel', receiptPhotos: [] },
  { id: 'e11', vehicleId: 'v4', status: 'accident', timestamp: daysAgo(20), costAmount: 3500, costCategory: 'accident', notes: 'Minor fender bender — parking lot. No third party.', receiptPhotos: ['mock-accident-1', 'mock-accident-2'] },
];

function isDemo() {
  return localStorage.getItem('sz_access_token') === 'demo-token';
}

interface StatusLogState {
  entries: StatusLogEntry[];
  isLoading: boolean;
}

export const useStatusLogStore = defineStore('statusLog', {
  state: (): StatusLogState => ({
    entries: [],
    isLoading: false,
  }),

  getters: {
    entriesForVehicle: (state) => (vehicleId: string) =>
      state.entries
        .filter(e => e.vehicleId === vehicleId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),

    costBreakdown: (state) => (vehicleId: string): Record<CostCategory, number> => {
      const result: Record<CostCategory, number> = { fuel: 0, service: 0, repair: 0, cleaning: 0, accident: 0, other: 0 };
      state.entries
        .filter(e => e.vehicleId === vehicleId && e.costAmount)
        .forEach(e => {
          const cat = e.costCategory || 'other';
          result[cat] += e.costAmount || 0;
        });
      return result;
    },

    receiptsForVehicle: (state) => (vehicleId: string) =>
      state.entries.filter(e => e.vehicleId === vehicleId && e.receiptPhotos.length > 0),

    totalFleetSpend: (state) =>
      state.entries.reduce((sum, e) => sum + (e.costAmount || 0), 0),
  },

  actions: {
    async fetchEntries(vehicleId?: string) {
      this.isLoading = true;
      try {
        if (isDemo()) {
          this.entries = [...MOCK_ENTRIES];
          return;
        }
        const params = vehicleId ? { vehicleId } : {};
        const response = await api.get('/status-log', { params });
        this.entries = response.data.map((e: any) => ({
          ...e,
          receiptPhotos: e.receiptPhotos?.map((p: any) => p.url || p.id) || [],
        }));
      } catch (error) {
        console.error('Failed to fetch entries:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async addEntry(entry: Omit<StatusLogEntry, 'id' | 'timestamp'>, receiptFiles?: File[]) {
      if (isDemo()) {
        const newEntry: StatusLogEntry = {
          ...entry,
          id: 'e' + Date.now(),
          timestamp: new Date().toISOString(),
        };
        this.entries.unshift(newEntry);
        return newEntry;
      }

      // Use FormData for multipart upload when there are receipt files
      const formData = new FormData();
      formData.append('vehicleId', entry.vehicleId);
      formData.append('status', entry.status);
      if (entry.odometer) formData.append('odometer', String(entry.odometer));
      if (entry.costAmount) formData.append('costAmount', String(entry.costAmount));
      if (entry.costCategory) formData.append('costCategory', entry.costCategory);
      if (entry.vendor) formData.append('vendor', entry.vendor);
      if (entry.notes) formData.append('notes', entry.notes);

      if (receiptFiles) {
        for (const file of receiptFiles) {
          formData.append('receipts', file);
        }
      }

      const response = await api.post('/status-log', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newEntry: StatusLogEntry = {
        ...response.data,
        receiptPhotos: response.data.receiptPhotos?.map((p: any) => p.url || p.id) || [],
      };
      this.entries.unshift(newEntry);
      return newEntry;
    },
  },
});
