import { defineStore } from 'pinia';
import Dexie, { Table } from 'dexie';

// IndexedDB setup for offline storage
class FleetzDB extends Dexie {
  syncQueue!: Table<SyncQueueItem>;
  offlineVehicles!: Table<any>;
  offlineRentals!: Table<any>;
  offlinePhotos!: Table<OfflinePhoto>;

  constructor() {
    super('FleetzDB');
    this.version(1).stores({
      syncQueue: '++id, operation, entityType, entityId, createdAt, status',
      offlineVehicles: 'id, registration, status',
      offlineRentals: 'id, bookingRef, status',
      offlinePhotos: '++id, inspectionId, position, synced',
    });
  }
}

const db = new FleetzDB();

export interface SyncQueueItem {
  id?: number;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: 'rental' | 'inspection' | 'vehicle_status' | 'walkin';
  entityId: string;
  data: any;
  createdAt: Date;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  retryCount: number;
  lastError?: string;
}

export interface OfflinePhoto {
  id?: number;
  inspectionId: string;
  position: string;
  base64Data: string;
  mimeType: string;
  synced: boolean;
  createdAt: Date;
}

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: Date | null;
  syncErrors: string[];
}

export const useSyncStore = defineStore('sync', {
  state: (): SyncState => ({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingCount: 0,
    lastSyncTime: null,
    syncErrors: [],
  }),

  getters: {
    hasPendingSync: (state) => state.pendingCount > 0,
  },

  actions: {
    initializeNetworkListener() {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.syncAll();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    },

    async queueOperation(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'status' | 'retryCount'>) {
      const queueItem: SyncQueueItem = {
        ...item,
        createdAt: new Date(),
        status: 'pending',
        retryCount: 0,
      };
      await db.syncQueue.add(queueItem);
      await this.updatePendingCount();

      if (this.isOnline) {
        this.syncAll();
      }
    },

    async updatePendingCount() {
      this.pendingCount = await db.syncQueue
        .where('status')
        .anyOf(['pending', 'failed'])
        .count();
    },

    async syncAll() {
      if (this.isSyncing || !this.isOnline) return;

      this.isSyncing = true;
      this.syncErrors = [];

      try {
        const pendingItems = await db.syncQueue
          .where('status')
          .anyOf(['pending', 'failed'])
          .and((item) => item.retryCount < 3)
          .toArray();

        for (const item of pendingItems) {
          await this.syncItem(item);
        }

        // Sync offline photos
        await this.syncPhotos();

        this.lastSyncTime = new Date();
      } catch (error: any) {
        this.syncErrors.push(error.message);
      } finally {
        this.isSyncing = false;
        await this.updatePendingCount();
      }
    },

    async syncItem(item: SyncQueueItem) {
      try {
        await db.syncQueue.update(item.id!, { status: 'syncing' });

        const { api } = await import('boot/axios');
        let endpoint = '';
        let method: 'post' | 'patch' | 'delete' = 'post';

        switch (item.entityType) {
          case 'rental':
            endpoint = `/rentals/${item.entityId}`;
            method = item.operation === 'CREATE' ? 'post' : 'patch';
            break;
          case 'inspection':
            endpoint = item.operation === 'CREATE'
              ? '/inspections'
              : `/inspections/${item.entityId}`;
            method = item.operation === 'CREATE' ? 'post' : 'patch';
            break;
          case 'vehicle_status':
            endpoint = `/vehicles/${item.entityId}/status`;
            method = 'patch';
            break;
          case 'walkin':
            endpoint = '/walkins';
            method = 'post';
            break;
        }

        await api[method](endpoint, item.data);
        await db.syncQueue.update(item.id!, { status: 'completed' });
      } catch (error: any) {
        await db.syncQueue.update(item.id!, {
          status: 'failed',
          retryCount: item.retryCount + 1,
          lastError: error.message,
        });
        throw error;
      }
    },

    async syncPhotos() {
      const unsyncedPhotos = await db.offlinePhotos
        .where('synced')
        .equals(0)
        .toArray();

      const { api } = await import('boot/axios');

      for (const photo of unsyncedPhotos) {
        try {
          const formData = new FormData();
          const blob = this.base64ToBlob(photo.base64Data, photo.mimeType);
          formData.append('photo', blob, `${photo.position}.jpg`);
          formData.append('position', photo.position);

          await api.post(`/inspections/${photo.inspectionId}/photos`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          await db.offlinePhotos.update(photo.id!, { synced: true });
        } catch (error) {
          console.error('Failed to sync photo:', error);
        }
      }
    },

    base64ToBlob(base64: string, mimeType: string): Blob {
      const byteCharacters = atob(base64.split(',')[1] || base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: mimeType });
    },

    async savePhotoOffline(photo: Omit<OfflinePhoto, 'id' | 'synced' | 'createdAt'>) {
      return db.offlinePhotos.add({
        ...photo,
        synced: false,
        createdAt: new Date(),
      });
    },

    async clearCompletedSync() {
      await db.syncQueue.where('status').equals('completed').delete();
    },
  },
});

export { db };
