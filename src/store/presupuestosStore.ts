import { create } from 'zustand';
import {
  type CategoriaType,
  type Presupuesto,
  type PresupuestosState,
} from '../types/index.ts';
import { CATEGORIA_COLORS, MOCK_PRESUPUESTOS } from '../data/mockData.ts';
import { ApiError, normalizeEntity, presupuestosApi, resolveEntityId } from '../services/api.ts';

const USE_MOCK_FALLBACK = import.meta.env.DEV;

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Error inesperado';

const normalizePresupuesto = (presupuesto: Presupuesto): Presupuesto =>
  normalizeEntity(presupuesto);

const sameId = (presupuesto: Presupuesto, id: string): boolean =>
  resolveEntityId(presupuesto) === id;

export const usePresupuestosStore = create<PresupuestosState>((set, get) => ({
  presupuestos: [],
  loading: false,
  error: null,

  loadPresupuestos: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await presupuestosApi.getAll();
      set({
        presupuestos: data.map(normalizePresupuesto),
        loading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (error instanceof ApiError && error.status === 401) {
        set({
          presupuestos: [],
          loading: false,
          error: errorMessage,
        });
        return;
      }

      if (USE_MOCK_FALLBACK) {
        set({
          presupuestos: MOCK_PRESUPUESTOS,
          loading: false,
          error: errorMessage,
        });
        return;
      }

      set({
        loading: false,
        error: errorMessage,
      });
    }
  },

  addPresupuesto: async (presupuesto) => {
    set({ loading: true, error: null });
    try {
      const payload: Omit<Presupuesto, 'id'> = {
        ...presupuesto,
        montoGastado: 0,
        color: CATEGORIA_COLORS[presupuesto.categoria] ?? '#94a3b8',
      };
      const { data } = await presupuestosApi.create(payload);
      const normalized = normalizePresupuesto(data);
      set((s) => ({
        presupuestos: [...s.presupuestos, normalized],
        loading: false,
        error: null,
      }));
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
      throw error;
    }
  },

  updatePresupuesto: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const { data } = await presupuestosApi.update(id, updates);
      const normalized = normalizePresupuesto(data);
      set((s) => ({
        presupuestos: s.presupuestos.map((p) => (sameId(p, id) ? normalized : p)),
        loading: false,
        error: null,
      }));
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
      throw error;
    }
  },

  deletePresupuesto: async (id) => {
    set({ loading: true, error: null });
    try {
      await presupuestosApi.delete(id);
      set((s) => ({
        presupuestos: s.presupuestos.filter((p) => !sameId(p, id)),
        loading: false,
        error: null,
      }));
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
      throw error;
    }
  },

  getPresupuestoPorCategoria: (cat: CategoriaType) =>
    get().presupuestos.find((p) => p.categoria === cat),
}));
