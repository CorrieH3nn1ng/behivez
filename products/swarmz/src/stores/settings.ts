import { defineStore } from 'pinia';
import { api } from 'boot/axios';

export interface NotificationPrefs {
  licenceExpiry: boolean;   // SA licence disk expiry
  serviceDue: boolean;      // service / maintenance reminder
  taxYearEnd: boolean;      // tax year-end (only relevant with Tax module)
  monthlySummary: boolean;  // monthly spend recap
}

export interface FeatureModules {
  expenses: boolean; // core — always on
  aiScan: boolean;   // AI slip / invoice scanning
  tax: boolean;      // logbook + SARS tax report
  fleet: boolean;    // drivers + status workflow
}

export interface UserSettings {
  onboarded: boolean;
  persona: string | null;
  modules: FeatureModules;
  notifications: NotificationPrefs;
}

export type Persona = 'just_my_car' | 'self_employed' | 'fleet';

const DEFAULTS: UserSettings = {
  onboarded: false,
  persona: null,
  modules: { expenses: true, aiScan: false, tax: false, fleet: false },
  notifications: { licenceExpiry: false, serviceDue: false, taxYearEnd: false, monthlySummary: false },
};

// What each persona switches on. Just a starting point — every toggle stays
// changeable afterwards in Settings. No lock-in.
const PERSONA_PRESETS: Record<Persona, Partial<FeatureModules>> = {
  just_my_car: { aiScan: true, tax: false, fleet: false },
  self_employed: { aiScan: true, tax: true, fleet: false },
  fleet: { aiScan: true, tax: true, fleet: true },
};

const CACHE_KEY = 'sz_settings';

function isDemo() {
  return localStorage.getItem('sz_access_token') === 'demo-token';
}

// Merge a (possibly partial) payload onto the full default shape
function normalize(data: Partial<UserSettings>): UserSettings {
  return {
    ...DEFAULTS,
    ...data,
    modules: { ...DEFAULTS.modules, ...(data.modules || {}) },
    notifications: { ...DEFAULTS.notifications, ...(data.notifications || {}) },
  };
}

interface SettingsState {
  settings: UserSettings;
  loaded: boolean;
  isLoading: boolean;
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    settings: normalize({}),
    loaded: false,
    isLoading: false,
  }),

  getters: {
    modules: (s) => s.settings.modules,
    notifications: (s) => s.settings.notifications,
    onboarded: (s) => s.settings.onboarded,
  },

  actions: {
    loadFromCache() {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return;
      try {
        this.settings = normalize(JSON.parse(raw));
        this.loaded = true;
      } catch {
        // ignore corrupt cache
      }
    },

    cache() {
      localStorage.setItem(CACHE_KEY, JSON.stringify(this.settings));
    },

    async fetch() {
      // Render instantly from cache first (works with no signal), then refresh.
      this.loadFromCache();
      if (isDemo()) {
        this.loaded = true;
        return;
      }
      this.isLoading = true;
      try {
        const { data } = await api.get('/settings');
        this.settings = normalize(data);
        this.loaded = true;
        this.cache();
      } catch (error) {
        console.error('Failed to load settings:', error);
        // keep whatever we have (cache or defaults) so the UI still works
      } finally {
        this.isLoading = false;
      }
    },

    async save(patch: Partial<UserSettings>) {
      // Optimistic local update so the UI feels instant.
      this.settings = normalize({
        ...this.settings,
        ...patch,
        modules: { ...this.settings.modules, ...(patch.modules || {}) },
        notifications: { ...this.settings.notifications, ...(patch.notifications || {}) },
      });
      this.cache();
      if (isDemo()) return;
      try {
        const { data } = await api.patch('/settings', patch);
        this.settings = normalize(data);
        this.cache();
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    },

    setModule(key: keyof FeatureModules, value: boolean) {
      return this.save({ modules: { ...this.settings.modules, [key]: value } });
    },

    setNotification(key: keyof NotificationPrefs, value: boolean) {
      return this.save({ notifications: { ...this.settings.notifications, [key]: value } });
    },

    applyPersona(persona: Persona) {
      const modules = { ...this.settings.modules, ...PERSONA_PRESETS[persona] };
      return this.save({ persona, onboarded: true, modules });
    },
  },
});
