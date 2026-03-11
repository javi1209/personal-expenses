import { create } from 'zustand';
import { type MetasState, type MetaAhorro } from '../types/index.ts';
import { ApiError, metasApi, normalizeEntity, resolveEntityId } from '../services/api.ts';

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Error inesperado';

const normalizeMeta = (meta: MetaAhorro): MetaAhorro => normalizeEntity(meta);

const sameId = (meta: MetaAhorro, id: string): boolean => resolveEntityId(meta) === id;

export const useMetasStore = create<MetasState>((set) => ({
  metas: [],
  loading: false,
  error: null,

  loadMetas: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await metasApi.getAll();
      set({
        metas: data.map(normalizeMeta),
        loading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (error instanceof ApiError && error.status === 401) {
        set({ metas: [], loading: false, error: errorMessage });
        return;
      }
      set({ loading: false, error: errorMessage });
    }
  },

  addMeta: async (meta) => {
    set({ loading: true, error: null });
    try {
      const { data } = await metasApi.create(meta);
      const normalized = normalizeMeta(data);
      set((s) => ({
        metas: [normalized, ...s.metas],
        loading: false,
        error: null,
      }));
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
      throw error;
    }
  },

  updateMeta: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const { data } = await metasApi.update(id, updates);
      const normalized = normalizeMeta(data);
      set((s) => ({
        metas: s.metas.map((m) => (sameId(m, id) ? normalized : m)),
        loading: false,
        error: null,
      }));
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
      throw error;
    }
  },

  deleteMeta: async (id) => {
    set({ loading: true, error: null });
    try {
      await metasApi.delete(id);
      set((s) => ({
        metas: s.metas.filter((m) => !sameId(m, id)),
        loading: false,
        error: null,
      }));
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
      throw error;
    }
  },

  addAporte: async (id, aporte) => {
    set({ loading: true, error: null });
    try {
      const { data } = await metasApi.addAporte(id, aporte);
      const normalized = normalizeMeta(data);
      set((s) => ({
        metas: s.metas.map((m) => (sameId(m, id) ? normalized : m)),
        loading: false,
        error: null,
      }));
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
      throw error;
    }
  },
}));
