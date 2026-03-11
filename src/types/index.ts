// ============================================================
// GASTOS APP — TypeScript Types
// ============================================================

// --- Enums / Unions ---

export type CategoriaType =
  | 'alimentacion'
  | 'transporte'
  | 'vivienda'
  | 'entretenimiento'
  | 'salud'
  | 'educacion'
  | 'ropa'
  | 'servicios'
  | 'otros';

export type PrioridadType = 'baja' | 'media' | 'alta';

export type EstadoGastoCompartido = 'pendiente' | 'parcial' | 'saldado';

export type PeriodoPresupuesto = 'mensual' | 'semanal' | 'anual';

// --- Entities ---

export interface Categoria {
  id: string;
  nombre: string;
  tipo: CategoriaType;
  icono: string;
  color: string;
}

export interface Gasto {
  _id?: string;
  id: string;
  descripcion: string;
  monto: number;
  fecha: string;               // ISO string
  categoria: CategoriaType;
  categoriaLabel: string;
  notas?: string;
  esRecurrente: boolean;
  cuentaVence?: string;        // ISO string for due date
  esCompartido: boolean;
  cuentaId?: string;           // ID de la billetera/cuenta asociada
  userId?: string;
}

export interface Presupuesto {
  _id?: string;
  id: string;
  categoria: CategoriaType;
  categoriaLabel: string;
  montoLimite: number;
  montoGastado: number;
  periodo: PeriodoPresupuesto;
  alertaUmbral: number;        // porcentaje (ej: 80)
  color: string;
  userId?: string;
}

export interface Participante {
  nombre: string;
  email?: string;
  monto: number;
  pagado: boolean;
  pagadoEn?: string;
}

export interface GastoCompartido {
  _id?: string;
  id: string;
  descripcion: string;
  montoTotal: number;
  fecha: string;
  categoria: CategoriaType;
  pagadoPor: string;
  participantes: Participante[];
  estado: EstadoGastoCompartido;
  grupo?: string;
  notas?: string;
  userId?: string;
}

export interface Alerta {
  id: string;
  tipo: 'vencimiento' | 'presupuesto' | 'compartido';
  titulo: string;
  mensaje: string;
  fecha: string;
  gastoId?: string;
  presupuestoId?: string;
  leida: boolean;
  urgente: boolean;
}

export interface Cuenta {
  _id?: string;
  id: string;
  nombre: string;
  tipo: 'efectivo' | 'banco' | 'tarjeta' | 'otro';
  saldoInicial: number;
  saldoActual: number;
  color: string;
  userId?: string;
}

export interface Aporte {
  id: string;
  monto: number;
  fecha: string;
  notas?: string;
}

export interface MetaAhorro {
  _id?: string;
  id: string;
  nombre: string;
  montoObjetivo: number;
  montoActual: number;
  fechaLimite: string;
  aportes: Aporte[];
  lograda: boolean;
  color: string;
  userId?: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  token?: string;
}

export interface AuthState {
  user: Usuario | null;
  token: string | null;
  loading: boolean;
  checkingAuth: boolean;
  isAuthenticated: () => boolean;
  bootstrapAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (nombre: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

// --- Store types ---

export interface GastosState {
  gastos: Gasto[];
  loading: boolean;
  error: string | null;
  filtroCategoria: CategoriaType | 'todas';
  filtroMes: string;
  searchQuery: string;
  montoMin: number | null;
  montoMax: number | null;
  loadGastos: () => Promise<void>;
  addGasto: (gasto: Omit<Gasto, 'id'>) => Promise<void>;
  updateGasto: (id: string, gasto: Partial<Gasto>) => Promise<void>;
  deleteGasto: (id: string) => Promise<void>;
  setFiltroCategoria: (cat: CategoriaType | 'todas') => void;
  setFiltroMes: (mes: string) => void;
  setSearchQuery: (query: string) => void;
  setMontoMin: (val: number | null) => void;
  setMontoMax: (val: number | null) => void;
  getGastosFiltrados: () => Gasto[];
  getTotalMes: () => number;
}

export interface PresupuestosState {
  presupuestos: Presupuesto[];
  loading: boolean;
  error: string | null;
  loadPresupuestos: () => Promise<void>;
  addPresupuesto: (p: Omit<Presupuesto, 'id' | 'montoGastado'>) => Promise<void>;
  updatePresupuesto: (id: string, p: Partial<Presupuesto>) => Promise<void>;
  deletePresupuesto: (id: string) => Promise<void>;
  getPresupuestoPorCategoria: (cat: CategoriaType) => Presupuesto | undefined;
}

export interface CompartidosState {
  gastos: GastoCompartido[];
  loading: boolean;
  error: string | null;
  loadGastos: () => Promise<void>;
  addGasto: (gasto: Omit<GastoCompartido, 'id'>) => Promise<void>;
  updateGasto: (id: string, gasto: Partial<GastoCompartido>) => void;
  upsertGasto: (gasto: GastoCompartido) => void;
  marcarPagado: (gastoId: string, participanteNombre: string) => Promise<void>;
  setGastos: (gastos: GastoCompartido[]) => void;
}

export interface CuentasState {
  cuentas: Cuenta[];
  loading: boolean;
  error: string | null;
  loadCuentas: () => Promise<void>;
  addCuenta: (cuenta: Omit<Cuenta, 'id' | 'saldoActual'>) => Promise<void>;
  updateCuenta: (id: string, updates: Partial<Cuenta>) => Promise<void>;
  deleteCuenta: (id: string) => Promise<void>;
}

export interface MetasState {
  metas: MetaAhorro[];
  loading: boolean;
  error: string | null;
  loadMetas: () => Promise<void>;
  addMeta: (meta: Omit<MetaAhorro, 'id' | 'montoActual' | 'aportes' | 'lograda'>) => Promise<void>;
  updateMeta: (id: string, updates: Partial<MetaAhorro>) => Promise<void>;
  deleteMeta: (id: string) => Promise<void>;
  addAporte: (id: string, aporte: Omit<Aporte, 'id'>) => Promise<void>;
}

// --- API response ---

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// --- Chart types ---

export interface DatoReporte {
  categoria: string;
  monto: number;
  color: string;
}

export interface DatoTendencia {
  mes: string;
  monto: number;
  presupuesto?: number;
}
