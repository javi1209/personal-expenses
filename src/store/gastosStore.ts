import { format } from 'date-fns';
import { create } from 'zustand';
import { type Gasto, type GastosState } from '../types/index.ts';
import { MOCK_GASTOS } from '../data/mockData.ts';
import { ApiError, gastosApi, normalizeEntity, resolveEntityId } from '../services/api.ts';
import { usePresupuestosStore } from './presupuestosStore.ts';

const USE_MOCK_FALLBACK = import.meta.env.DEV;

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Error inesperado';

const normalizeGasto = (gasto: Gasto): Gasto => normalizeEntity(gasto);

const sameId = (gasto: Gasto, id: string): boolean => resolveEntityId(gasto) === id;

const refreshPresupuestos = async (): Promise<void> => {
  await usePresupuestosStore.getState().loadPresupuestos();
};

export const useGastosStore = create<GastosState>((set, get) => ({
  gastos: [],
  loading: false,
  error: null,
  filtroCategoria: 'todas',
  filtroMes: format(new Date(), 'yyyy-MM'),
  searchQuery: '',
  montoMin: null,
  montoMax: null,

  setSearchQuery: (q) => set({ searchQuery: q }),
  setMontoMin: (val) => set({ montoMin: val }),
  setMontoMax: (val) => set({ montoMax: val }),

  loadGastos: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await gastosApi.getAll();
      set({ gastos: data.map(normalizeGasto), loading: false, error: null });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (error instanceof ApiError && error.status === 401) {
        set({ gastos: [], loading: false, error: errorMessage });
        return;
      }

      if (USE_MOCK_FALLBACK) {
        set({ gastos: MOCK_GASTOS, loading: false, error: errorMessage });
        return;
      }

      set({ loading: false, error: errorMessage });
    }
  },

  addGasto: async (gasto) => {
    set({ loading: true, error: null });
    try {
      const { data } = await gastosApi.create(gasto);
      const normalized = normalizeGasto(data);
      set((s) => ({ gastos: [normalized, ...s.gastos], loading: false, error: null }));
      void refreshPresupuestos();
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
      throw error;
    }
  },

  updateGasto: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const { data } = await gastosApi.update(id, updates);
      const normalized = normalizeGasto(data);
      set((s) => ({
        gastos: s.gastos.map((g) => (sameId(g, id) ? normalized : g)),
        loading: false,
        error: null,
      }));
      void refreshPresupuestos();
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
      throw error;
    }
  },

  deleteGasto: async (id) => {
    set({ loading: true, error: null });
    try {
      await gastosApi.delete(id);
      set((s) => ({
        gastos: s.gastos.filter((g) => !sameId(g, id)),
        loading: false,
        error: null,
      }));
      void refreshPresupuestos();
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
      throw error;
    }
  },

  setFiltroCategoria: (cat) => set({ filtroCategoria: cat }),
  setFiltroMes: (mes) => set({ filtroMes: mes }),

  getGastosFiltrados: () => {
    const { gastos, filtroCategoria, filtroMes, searchQuery, montoMin, montoMax } = get();
    const query = searchQuery.trim().toLowerCase();

    return gastos.filter((g) => {
      const mesGasto = g.fecha.slice(0, 7);
      const matchMes = filtroMes === 'todos' || mesGasto === filtroMes;
      const matchCat = filtroCategoria === 'todas' || g.categoria === filtroCategoria;

      const matchSearch = !query ||
        g.descripcion.toLowerCase().includes(query) ||
        (g.notas && g.notas.toLowerCase().includes(query)) ||
        g.categoriaLabel.toLowerCase().includes(query);

      const matchMin = montoMin === null || g.monto >= montoMin;
      const matchMax = montoMax === null || g.monto <= montoMax;

      return matchMes && matchCat && matchSearch && matchMin && matchMax;
    });
  },

  getTotalMes: () => get().getGastosFiltrados().reduce((acc, g) => acc + g.monto, 0),
}));
