import { io, type Socket } from 'socket.io-client';
import { TOKEN_STORAGE_KEY } from './api.ts';

let socket: Socket | null = null;
let socketToken: string | null = null;

const readToken = (): string | null => localStorage.getItem(TOKEN_STORAGE_KEY);

export const getSocket = (): Socket => {
  const token = readToken();
  const tokenChanged = token !== socketToken;

  if (!socket || tokenChanged) {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    socket = io('/', {
      transports: ['websocket', 'polling'],
      auth: token ? { token } : undefined,
      autoConnect: Boolean(token),
    });
    socketToken = token;
  } else if (token && !socket.connected) {
    socket.connect();
  }

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    socketToken = null;
  }
};

// Events emitted by the server
export const SOCKET_EVENTS = {
  // Gastos compartidos
  GASTO_COMPARTIDO_NUEVO:      'gasto_compartido:nuevo',
  GASTO_COMPARTIDO_ACTUALIZADO: 'gasto_compartido:actualizado',
  PARTICIPANTE_PAGADO:         'gasto_compartido:participante_pagado',
  // Alertas
  ALERTA_NUEVA:                'alerta:nueva',
} as const;
