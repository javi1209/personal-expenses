import { create } from 'zustand';
import { MOCK_COMPARTIDOS } from '../data/mockData.ts';
import { ApiError, compartidosApi, normalizeEntity, resolveEntityId } from '../services/api.ts';
import { type CompartidosState, type GastoCompartido } from '../types/index.ts';

const USE_MOCK_FALLBACK = import.meta.env.DEV;

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Error inesperado';

const normalizeCompartido = (gasto: GastoCompartido): GastoCompartido =>
  normalizeEntity(gasto);

const upsert = (
  current: GastoCompartido[],
  incoming: GastoCompartido
): GastoCompartido[] => {
  const normalized = normalizeCompartido(incoming);
  const incomingId = resolveEntityId(normalized);
  const existingIndex = current.findIndex((g) => resolveEntityId(g) === incomingId);

  if (existingIndex === -1) return [normalized, ...current];

  return current.map((g, idx) => (idx === existingIndex ? normalized : g));
};

export const useCompartidosStore = create<CompartidosState>((set) => ({
  gastos: [],
  loading: false,
  error: null,

  loadGastos: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await compartidosApi.getAll();
      set({
        gastos: data.map(normalizeCompartido),
        loading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (error instanceof ApiError && error.status === 401) {
        set({
          gastos: [],
          loading: false,
          error: errorMessage,
        });
        return;
      }

      if (USE_MOCK_FALLBACK) {
        set({
          gastos: MOCK_COMPARTIDOS,
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

  addGasto: async (gasto) => {
    set({ loading: true, error: null });
    try {
      const { data } = await compartidosApi.create(gasto);
      set((s) => ({
        gastos: upsert(s.gastos, data),
        loading: false,
        error: null,
      }));
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
      throw error;
    }
  },

  updateGasto: (id, updates) => {
    set((s) => ({
      gastos: s.gastos.map((g) =>
        resolveEntityId(g) === id ? normalizeCompartido({ ...g, ...updates }) : g
      ),
    }));
  },

  upsertGasto: (gasto) => {
    set((s) => ({ gastos: upsert(s.gastos, gasto) }));
  },

  marcarPagado: async (gastoId, participanteNombre) => {
    set({ loading: true, error: null });
    try {
      const { data } = await compartidosApi.marcarPagado(gastoId, participanteNombre);
      set((s) => ({
        gastos: upsert(s.gastos, data),
        loading: false,
        error: null,
      }));
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
      throw error;
    }
  },

  setGastos: (gastos) => set({ gastos: gastos.map(normalizeCompartido) }),
}));
