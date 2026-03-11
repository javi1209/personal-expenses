import {
  type ApiResponse,
  type Cuenta,
  type Gasto,
  type GastoCompartido,
  type Presupuesto,
  type Usuario,
  type MetaAhorro,
  type Aporte,
} from '../types/index.ts';
import { API_BASE_URL } from '../config/runtime.ts';
export const TOKEN_STORAGE_KEY = 'got_token';

type EntityWithMongoId = { _id?: string; id?: string };
type ErrorPayload = { message?: string; detail?: string } | null;

export interface AuthResponseData {
  token: string;
  user: Usuario;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const getStoredToken = (): string | null =>
  localStorage.getItem(TOKEN_STORAGE_KEY);

export const setStoredToken = (token: string): void => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

export const clearStoredToken = (): void => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

export const resolveEntityId = <T extends EntityWithMongoId>(entity: T): string =>
  entity.id ?? entity._id ?? '';

export const normalizeEntity = <T extends EntityWithMongoId>(entity: T): T & { id: string } => ({
  ...entity,
  id: resolveEntityId(entity),
});

export const normalizeEntityList = <T extends EntityWithMongoId>(
  entities: T[]
): Array<T & { id: string }> => entities.map(normalizeEntity);

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) ?? {}),
    },
  });

  if (!res.ok) {
    const parsed = await res
      .json()
      .catch(() => null) as ErrorPayload;
    const fallback = `Error en la solicitud (${res.status})`;
    const message = parsed?.message ?? parsed?.detail ?? fallback;
    if (res.status === 401) {
      clearStoredToken();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    throw new ApiError(message, res.status);
  }

  return res.json() as Promise<T>;
}

export const authApi = {
  register: (payload: {
    nombre: string;
    email: string;
    password: string;
  }): Promise<ApiResponse<AuthResponseData>> =>
    request<ApiResponse<AuthResponseData>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: {
    email: string;
    password: string;
  }): Promise<ApiResponse<AuthResponseData>> =>
    request<ApiResponse<AuthResponseData>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  me: (): Promise<ApiResponse<{ user: Usuario }>> =>
    request<ApiResponse<{ user: Usuario }>>('/auth/me'),
};

// --- Gastos ---
export const gastosApi = {
  getAll: async (): Promise<ApiResponse<Gasto[]>> => {
    const res = await request<ApiResponse<Gasto[]>>('/gastos');
    return { ...res, data: normalizeEntityList(res.data) };
  },

  create: async (data: Omit<Gasto, 'id'>): Promise<ApiResponse<Gasto>> => {
    const res = await request<ApiResponse<Gasto>>('/gastos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return { ...res, data: normalizeEntity(res.data) };
  },

  update: async (id: string, data: Partial<Gasto>): Promise<ApiResponse<Gasto>> => {
    const res = await request<ApiResponse<Gasto>>(`/gastos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return { ...res, data: normalizeEntity(res.data) };
  },

  delete: async (id: string): Promise<ApiResponse<null>> =>
    request<ApiResponse<null>>(`/gastos/${id}`, { method: 'DELETE' }),
};

// --- Gastos compartidos ---
export const compartidosApi = {
  getAll: async (): Promise<ApiResponse<GastoCompartido[]>> => {
    const res = await request<ApiResponse<GastoCompartido[]>>('/compartidos');
    return { ...res, data: normalizeEntityList(res.data) };
  },

  create: async (data: Omit<GastoCompartido, 'id'>): Promise<ApiResponse<GastoCompartido>> => {
    const res = await request<ApiResponse<GastoCompartido>>('/compartidos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return { ...res, data: normalizeEntity(res.data) };
  },

  marcarPagado: async (id: string, participante: string): Promise<ApiResponse<GastoCompartido>> => {
    const res = await request<ApiResponse<GastoCompartido>>(`/compartidos/${id}/pagar`, {
      method: 'POST',
      body: JSON.stringify({ participante }),
    });
    return { ...res, data: normalizeEntity(res.data) };
  },
};

// --- Presupuestos ---
export const presupuestosApi = {
  getAll: async (): Promise<ApiResponse<Presupuesto[]>> => {
    const res = await request<ApiResponse<Presupuesto[]>>('/presupuestos');
    return { ...res, data: normalizeEntityList(res.data) };
  },

  create: async (data: Omit<Presupuesto, 'id'>): Promise<ApiResponse<Presupuesto>> => {
    const res = await request<ApiResponse<Presupuesto>>('/presupuestos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return { ...res, data: normalizeEntity(res.data) };
  },

  update: async (id: string, data: Partial<Presupuesto>): Promise<ApiResponse<Presupuesto>> => {
    const res = await request<ApiResponse<Presupuesto>>(`/presupuestos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return { ...res, data: normalizeEntity(res.data) };
  },

  delete: async (id: string): Promise<ApiResponse<null>> =>
    request<ApiResponse<null>>(`/presupuestos/${id}`, { method: 'DELETE' }),
};

// --- Cuentas ---
export const cuentasApi = {
  getAll: async (): Promise<ApiResponse<Cuenta[]>> => {
    const res = await request<ApiResponse<Cuenta[]>>('/cuentas');
    return { ...res, data: normalizeEntityList(res.data) };
  },

  create: async (data: Omit<Cuenta, 'id' | 'saldoActual'>): Promise<ApiResponse<Cuenta>> => {
    const res = await request<ApiResponse<Cuenta>>('/cuentas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return { ...res, data: normalizeEntity(res.data) };
  },

  update: async (id: string, data: Partial<Cuenta>): Promise<ApiResponse<Cuenta>> => {
    const res = await request<ApiResponse<Cuenta>>(`/cuentas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return { ...res, data: normalizeEntity(res.data) };
  },

  delete: async (id: string): Promise<ApiResponse<null>> =>
    request<ApiResponse<null>>(`/cuentas/${id}`, { method: 'DELETE' }),
};

// --- Metas de Ahorro ---
export const metasApi = {
  getAll: async (): Promise<ApiResponse<MetaAhorro[]>> => {
    const res = await request<ApiResponse<MetaAhorro[]>>('/metas');
    return { ...res, data: normalizeEntityList(res.data) };
  },

  create: async (data: Omit<MetaAhorro, 'id' | 'montoActual' | 'aportes' | 'lograda'>): Promise<ApiResponse<MetaAhorro>> => {
    const res = await request<ApiResponse<MetaAhorro>>('/metas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return { ...res, data: normalizeEntity(res.data) };
  },

  update: async (id: string, data: Partial<MetaAhorro>): Promise<ApiResponse<MetaAhorro>> => {
    const res = await request<ApiResponse<MetaAhorro>>(`/metas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return { ...res, data: normalizeEntity(res.data) };
  },

  delete: async (id: string): Promise<ApiResponse<null>> =>
    request<ApiResponse<null>>(`/metas/${id}`, { method: 'DELETE' }),

  addAporte: async (id: string, aporte: Omit<Aporte, 'id'>): Promise<ApiResponse<MetaAhorro>> => {
    const res = await request<ApiResponse<MetaAhorro>>(`/metas/${id}/aportes`, {
      method: 'POST',
      body: JSON.stringify(aporte),
    });
    return { ...res, data: normalizeEntity(res.data) };
  },
};

// --- Reportes ---
export const reportesApi = {
  getTendencia: (months?: number): Promise<ApiResponse<{ mes: string; Gastos: number; Presupuesto: number }[]>> =>
    request<ApiResponse<{ mes: string; Gastos: number; Presupuesto: number }[]>>(`/reportes/tendencia${months ? `?months=${months}` : ''}`),
};

// --- Admin (Recurrentes) ---
export interface RecurrenteResult {
  generados: number;
  mes: string;
  yaGenerado: boolean;
}

export interface RecurrenteLogEntry {
  _id: string;
  mes: string;
  generados: number;
  createdAt: string;
}

export const adminApi = {
  generarRecurrentes: (): Promise<ApiResponse<RecurrenteResult>> =>
    request<ApiResponse<RecurrenteResult>>('/admin/generar-recurrentes', { method: 'POST' }),

  getRecurrentesLog: (): Promise<ApiResponse<RecurrenteLogEntry[]>> =>
    request<ApiResponse<RecurrenteLogEntry[]>>('/admin/recurrentes-log'),
};

// --- Alertas ---
export interface Alerta {
  id: string;
  userId: string;
  tipo: 'presupuesto' | 'compartido' | 'sistema';
  titulo: string;
  mensaje: string;
  leida: boolean;
  referenciaId?: string;
  createdAt: string;
  updatedAt: string;
}

export const alertasApi = {
  getAll: async (): Promise<ApiResponse<Alerta[]>> => {
    const res = await request<ApiResponse<Alerta[]>>('/alertas');
    return { ...res, data: normalizeEntityList(res.data as EntityWithMongoId[]) as unknown as Alerta[] };
  },

  marcarLeida: async (id: string): Promise<ApiResponse<Alerta>> => {
    const res = await request<ApiResponse<Alerta>>(`/alertas/${id}/leer`, { method: 'PUT' });
    return { ...res, data: normalizeEntity(res.data as EntityWithMongoId) as unknown as Alerta };
  },

  marcarTodasLeidas: (): Promise<ApiResponse<{ message: string }>> =>
    request<ApiResponse<{ message: string }>>('/alertas/leer-todas', { method: 'PUT' }),
};
