import { create } from 'zustand';
import {
  ApiError,
  authApi,
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from '../services/api.ts';
import { disconnectSocket } from '../services/socket.ts';
import { type AuthState, type Usuario } from '../types/index.ts';
import { useCompartidosStore } from './compartidosStore.ts';
import { useGastosStore } from './gastosStore.ts';
import { usePresupuestosStore } from './presupuestosStore.ts';

const normalizeUser = (user: Usuario): Usuario => ({
  id: user.id,
  nombre: user.nombre,
  email: user.email,
});

const resetDataStores = (): void => {
  useGastosStore.setState({ gastos: [], loading: false, error: null });
  usePresupuestosStore.setState({ presupuestos: [], loading: false, error: null });
  useCompartidosStore.setState({ gastos: [], loading: false, error: null });
};

const clearSession = (set: (partial: Partial<AuthState>) => void): void => {
  disconnectSocket();
  clearStoredToken();
  resetDataStores();
  set({
    user: null,
    token: null,
    loading: false,
    checkingAuth: false,
  });
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: getStoredToken(),
  loading: false,
  checkingAuth: true,

  isAuthenticated: () => Boolean(get().token && get().user),

  bootstrapAuth: async () => {
    const token = getStoredToken();
    if (!token) {
      set({ token: null, user: null, checkingAuth: false });
      return;
    }

    set({ checkingAuth: true, token });
    try {
      const { data } = await authApi.me();
      set({
        token,
        user: normalizeUser(data.user),
        checkingAuth: false,
      });
    } catch {
      clearSession(set);
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await authApi.login({ email, password });
      setStoredToken(data.token);
      set({
        token: data.token,
        user: normalizeUser(data.user),
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  register: async (nombre, email, password) => {
    set({ loading: true });
    try {
      const { data } = await authApi.register({ nombre, email, password });
      setStoredToken(data.token);
      set({
        token: data.token,
        user: normalizeUser(data.user),
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: () => {
    clearSession(set);
  },
}));

export const isUnauthorizedError = (error: unknown): boolean =>
  error instanceof ApiError && error.status === 401;
