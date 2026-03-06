import { create } from 'zustand';
import { API_BASE_URL } from '../config/runtime.ts';
import { TOKEN_STORAGE_KEY } from '../services/api.ts';

export const PREFERENCES_STORAGE_KEY = 'got_preferences';

export type AppLocale = 'es-MX' | 'es-AR' | 'en-US';
export type AppCurrency = 'MXN' | 'ARS' | 'USD';
export type AppTheme = 'light' | 'dark';

export const LOCALE_OPTIONS: Array<{ value: AppLocale; label: string }> = [
  { value: 'es-MX', label: 'Español (México)' },
  { value: 'es-AR', label: 'Español (Argentina)' },
  { value: 'en-US', label: 'English (US)' },
];

export const CURRENCY_OPTIONS: Array<{ value: AppCurrency; label: string }> = [
  { value: 'MXN', label: 'MXN (Peso mexicano)' },
  { value: 'ARS', label: 'ARS (Peso argentino)' },
  { value: 'USD', label: 'USD (US Dollar)' },
];

export const THEME_OPTIONS: Array<{ value: AppTheme; label: string }> = [
  { value: 'dark', label: 'Oscuro' },
  { value: 'light', label: 'Claro' },
];

const DEFAULT_PREFERENCES = {
  locale: 'es-MX' as AppLocale,
  currency: 'MXN' as AppCurrency,
  theme: 'dark' as AppTheme,
};

interface PreferencesState {
  locale: AppLocale;
  currency: AppCurrency;
  theme: AppTheme;
  initialized: boolean;
  setLocale: (locale: AppLocale) => void;
  setCurrency: (currency: AppCurrency) => void;
  setTheme: (theme: AppTheme) => void;
  syncWithBackend: (token: string) => Promise<void>;
  updateBackend: () => Promise<void>;
}

type PreferencesPayload = {
  locale?: AppLocale;
  currency?: AppCurrency;
  theme?: AppTheme;
};

type PreferencesApiResponse = {
  data?: PreferencesPayload;
} & PreferencesPayload;

const isLocale = (value: unknown): value is AppLocale =>
  typeof value === 'string' && LOCALE_OPTIONS.some((option) => option.value === value);

const isCurrency = (value: unknown): value is AppCurrency =>
  typeof value === 'string' && CURRENCY_OPTIONS.some((option) => option.value === value);

const isTheme = (value: unknown): value is AppTheme =>
  value === 'light' || value === 'dark';

const readStoredPreferences = () => {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
  if (!raw) return DEFAULT_PREFERENCES;
  try {
    const parsed = JSON.parse(raw);
    return {
      locale: isLocale(parsed.locale) ? parsed.locale : DEFAULT_PREFERENCES.locale,
      currency: isCurrency(parsed.currency) ? parsed.currency : DEFAULT_PREFERENCES.currency,
      theme: isTheme(parsed.theme) ? parsed.theme : DEFAULT_PREFERENCES.theme,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
};

const persistPreferences = (prefs: { locale: AppLocale; currency: AppCurrency; theme: AppTheme }) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(prefs));
  if (prefs.theme === 'light') document.documentElement.classList.add('light-theme');
  else document.documentElement.classList.remove('light-theme');
};

const initial = readStoredPreferences();
if (typeof window !== 'undefined') {
  if (initial.theme === 'light') document.documentElement.classList.add('light-theme');
  else document.documentElement.classList.remove('light-theme');
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  locale: initial.locale,
  currency: initial.currency,
  theme: initial.theme,
  initialized: false,

  setLocale: (locale) => {
    set({ locale });
    persistPreferences({ ...get() });
    get().updateBackend();
  },

  setCurrency: (currency) => {
    set({ currency });
    persistPreferences({ ...get() });
    get().updateBackend();
  },

  setTheme: (theme) => {
    set({ theme });
    persistPreferences({ ...get() });
    get().updateBackend();
  },

  syncWithBackend: async (token: string) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/user/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.ok) {
        const payload = await resp.json() as PreferencesApiResponse;
        const settings = payload.data ?? payload;
        set({
          locale: isLocale(settings.locale) ? settings.locale : get().locale,
          currency: isCurrency(settings.currency) ? settings.currency : get().currency,
          theme: isTheme(settings.theme) ? settings.theme : get().theme,
          initialized: true,
        });
        persistPreferences({ ...get() });
      }
    } catch (err) {
      console.error('Failed to sync preferences:', err);
    }
  },

  updateBackend: async () => {
    const { locale, currency, theme } = get();
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) return;

    try {
      await fetch(`${API_BASE_URL}/user/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ locale, currency, theme }),
      });
    } catch (err) {
      console.error('Failed to update backend preferences:', err);
    }
  },
}));
