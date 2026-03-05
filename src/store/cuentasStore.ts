import { create } from 'zustand';
import { type Cuenta, type CuentasState } from '../types/index.ts';
import { ApiError, normalizeEntity, cuentasApi, resolveEntityId } from '../services/api.ts';

const normalizeCuenta = (cuenta: Cuenta): Cuenta & { id: string } =>
    normalizeEntity(cuenta);

const sameId = (cuenta: Cuenta, id: string): boolean =>
    resolveEntityId(cuenta) === id;

export const useCuentasStore = create<CuentasState>((set) => ({
    cuentas: [],
    loading: false,
    error: null,

    loadCuentas: async () => {
        set({ loading: true, error: null });
        try {
            const { data } = await cuentasApi.getAll();
            set({
                cuentas: data.map(normalizeCuenta),
                loading: false,
                error: null,
            });
        } catch (error) {
            set({
                loading: false,
                error: error instanceof ApiError ? error.message : 'Error al cargar cuentas',
            });
        }
    },

    addCuenta: async (cuenta) => {
        set({ loading: true, error: null });
        try {
            const { data } = await cuentasApi.create(cuenta);
            const normalized = normalizeCuenta(data);
            set((s) => ({
                cuentas: [...s.cuentas, normalized],
                loading: false,
                error: null,
            }));
        } catch (error) {
            set({ loading: false, error: 'Error al crear cuenta' });
            throw error;
        }
    },

    updateCuenta: async (id, updates) => {
        set({ loading: true, error: null });
        try {
            const { data } = await cuentasApi.update(id, updates);
            const normalized = normalizeCuenta(data);
            set((s) => ({
                cuentas: s.cuentas.map((c) => (sameId(c, id) ? normalized : c)),
                loading: false,
                error: null,
            }));
        } catch (error) {
            set({ loading: false, error: 'Error al actualizar cuenta' });
            throw error;
        }
    },

    deleteCuenta: async (id) => {
        set({ loading: true, error: null });
        try {
            await cuentasApi.delete(id);
            set((s) => ({
                cuentas: s.cuentas.filter((c) => !sameId(c, id)),
                loading: false,
                error: null,
            }));
        } catch (error) {
            set({ loading: false, error: 'Error al eliminar cuenta' });
            throw error;
        }
    },
}));
