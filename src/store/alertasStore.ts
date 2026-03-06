import { create } from 'zustand';
import { type Alerta, alertasApi } from '../services/api.ts';
import { getSocket } from '../services/socket.ts';

export interface AlertasState {
    alertas: Alerta[];
    loading: boolean;
    error: string | null;

    loadAlertas: () => Promise<void>;
    marcarLeida: (id: string) => Promise<void>;
    marcarTodasLeidas: () => Promise<void>;
    agregarAlerta: (alerta: Alerta) => void;
    initializeSockets: () => void;
}

export const useAlertasStore = create<AlertasState>((set, get) => ({
    alertas: [],
    loading: false,
    error: null,

    loadAlertas: async () => {
        set({ loading: true, error: null });
        try {
            const { data } = await alertasApi.getAll();
            set({ alertas: data, loading: false });
        } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Error cargando alertas', loading: false });
        }
    },

    marcarLeida: async (id: string) => {
        try {
            const { data } = await alertasApi.marcarLeida(id);
            set((s) => ({
                alertas: s.alertas.map((a) => (a.id === id ? data : a)),
            }));
        } catch (err) {
            console.error('Error al marcar alerta como leída', err);
        }
    },

    marcarTodasLeidas: async () => {
        try {
            await alertasApi.marcarTodasLeidas();
            set((s) => ({
                alertas: s.alertas.map((a) => ({ ...a, leida: true })),
            }));
        } catch (err) {
            console.error('Error al marcar todas las alertas como leídas', err);
        }
    },

    agregarAlerta: (alerta: Alerta) => {
        set((s) => ({
            alertas: [alerta, ...s.alertas],
        }));
    },

    initializeSockets: () => {
        // Suscribirse a los eventos de alerta en tiempo real
        const socket = getSocket();
        if (socket) {
            socket.on('alerta:nueva', (alerta: unknown) => {
                get().agregarAlerta(alerta as Alerta);
            });
        }
    },
}));
