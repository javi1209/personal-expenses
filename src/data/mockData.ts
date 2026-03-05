// ============================================================
// GASTOS APP — Mock Data
// ============================================================

import { type Gasto, type Presupuesto, type GastoCompartido, type Categoria } from '../types/index.ts';

export const CATEGORIAS: Categoria[] = [
  { id: '1', nombre: 'Alimentación',    tipo: 'alimentacion',   icono: 'utensils',   color: '#e8a020' },
  { id: '2', nombre: 'Transporte',      tipo: 'transporte',     icono: 'car',        color: '#3b82f6' },
  { id: '3', nombre: 'Vivienda',        tipo: 'vivienda',       icono: 'home',       color: '#8b5cf6' },
  { id: '4', nombre: 'Entretenimiento', tipo: 'entretenimiento', icono: 'gamepad-2', color: '#ec4899' },
  { id: '5', nombre: 'Salud',           tipo: 'salud',          icono: 'heart-pulse', color: '#ef4444' },
  { id: '6', nombre: 'Educación',       tipo: 'educacion',      icono: 'book-open',  color: '#06b6d4' },
  { id: '7', nombre: 'Ropa',            tipo: 'ropa',           icono: 'shirt',      color: '#f97316' },
  { id: '8', nombre: 'Servicios',       tipo: 'servicios',      icono: 'zap',        color: '#a3e635' },
  { id: '9', nombre: 'Otros',           tipo: 'otros',          icono: 'circle-dot', color: '#94a3b8' },
];

export const CATEGORIA_COLORS: Record<string, string> = {
  alimentacion:   '#e8a020',
  transporte:     '#3b82f6',
  vivienda:       '#8b5cf6',
  entretenimiento:'#ec4899',
  salud:          '#ef4444',
  educacion:      '#06b6d4',
  ropa:           '#f97316',
  servicios:      '#a3e635',
  otros:          '#94a3b8',
};

export const MOCK_GASTOS: Gasto[] = [
  {
    id: '1', descripcion: 'Supermercado La Reina', monto: 4500,
    fecha: '2026-02-28', categoria: 'alimentacion', categoriaLabel: 'Alimentación',
    esRecurrente: false, esCompartido: false,
  },
  {
    id: '2', descripcion: 'Factura de electricidad', monto: 1800,
    fecha: '2026-02-25', categoria: 'servicios', categoriaLabel: 'Servicios',
    esRecurrente: true, cuentaVence: '2026-03-05', esCompartido: false,
  },
  {
    id: '3', descripcion: 'Netflix', monto: 599,
    fecha: '2026-02-20', categoria: 'entretenimiento', categoriaLabel: 'Entretenimiento',
    esRecurrente: true, cuentaVence: '2026-03-04', esCompartido: false,
  },
  {
    id: '4', descripcion: 'Gasolina', monto: 950,
    fecha: '2026-02-22', categoria: 'transporte', categoriaLabel: 'Transporte',
    esRecurrente: false, esCompartido: false,
  },
  {
    id: '5', descripcion: 'Renta mensual', monto: 12000,
    fecha: '2026-02-01', categoria: 'vivienda', categoriaLabel: 'Vivienda',
    esRecurrente: true, cuentaVence: '2026-03-01', esCompartido: false,
  },
  {
    id: '6', descripcion: 'Consulta médica', monto: 800,
    fecha: '2026-02-18', categoria: 'salud', categoriaLabel: 'Salud',
    esRecurrente: false, esCompartido: false,
  },
  {
    id: '7', descripcion: 'Curso de programación', monto: 2500,
    fecha: '2026-02-15', categoria: 'educacion', categoriaLabel: 'Educación',
    esRecurrente: false, esCompartido: false,
  },
  {
    id: '8', descripcion: 'Spotify', monto: 199,
    fecha: '2026-02-10', categoria: 'entretenimiento', categoriaLabel: 'Entretenimiento',
    esRecurrente: true, cuentaVence: '2026-03-10', esCompartido: false,
  },
  {
    id: '9', descripcion: 'Tenis running', monto: 1800,
    fecha: '2026-02-05', categoria: 'ropa', categoriaLabel: 'Ropa',
    esRecurrente: false, esCompartido: false,
  },
  {
    id: '10', descripcion: 'Internet fibra óptica', monto: 649,
    fecha: '2026-02-03', categoria: 'servicios', categoriaLabel: 'Servicios',
    esRecurrente: true, cuentaVence: '2026-03-08', esCompartido: false,
  },
];

export const MOCK_PRESUPUESTOS: Presupuesto[] = [
  { id: 'p1', categoria: 'alimentacion',    categoriaLabel: 'Alimentación',    montoLimite: 6000,  montoGastado: 4500,  periodo: 'mensual', alertaUmbral: 80, color: '#e8a020' },
  { id: 'p2', categoria: 'transporte',      categoriaLabel: 'Transporte',      montoLimite: 2000,  montoGastado: 950,   periodo: 'mensual', alertaUmbral: 80, color: '#3b82f6' },
  { id: 'p3', categoria: 'vivienda',        categoriaLabel: 'Vivienda',        montoLimite: 13000, montoGastado: 12000, periodo: 'mensual', alertaUmbral: 85, color: '#8b5cf6' },
  { id: 'p4', categoria: 'entretenimiento', categoriaLabel: 'Entretenimiento', montoLimite: 1000,  montoGastado: 798,   periodo: 'mensual', alertaUmbral: 75, color: '#ec4899' },
  { id: 'p5', categoria: 'salud',           categoriaLabel: 'Salud',           montoLimite: 2000,  montoGastado: 800,   periodo: 'mensual', alertaUmbral: 80, color: '#ef4444' },
  { id: 'p6', categoria: 'servicios',       categoriaLabel: 'Servicios',       montoLimite: 3000,  montoGastado: 2449,  periodo: 'mensual', alertaUmbral: 80, color: '#a3e635' },
];

export const MOCK_COMPARTIDOS: GastoCompartido[] = [
  {
    id: 'c1',
    descripcion: 'Cena en La Taberna del Norte',
    montoTotal: 1800,
    fecha: '2026-02-26',
    categoria: 'alimentacion',
    pagadoPor: 'Jon Snow',
    estado: 'pendiente',
    participantes: [
      { nombre: 'Jon Snow',      monto: 450, pagado: true,  pagadoEn: '2026-02-26' },
      { nombre: 'Arya Stark',    monto: 450, pagado: false },
      { nombre: 'Sansa Stark',   monto: 450, pagado: false },
      { nombre: 'Tyrion Lannister', monto: 450, pagado: false },
    ],
  },
  {
    id: 'c2',
    descripcion: 'Airbnb Viaje a Invernalia',
    montoTotal: 9000,
    fecha: '2026-02-10',
    categoria: 'vivienda',
    pagadoPor: 'Daenerys Targaryen',
    estado: 'parcial',
    participantes: [
      { nombre: 'Daenerys Targaryen', monto: 3000, pagado: true,  pagadoEn: '2026-02-10' },
      { nombre: 'Jon Snow',           monto: 3000, pagado: true,  pagadoEn: '2026-02-15' },
      { nombre: 'Jorah Mormont',      monto: 3000, pagado: false },
    ],
  },
  {
    id: 'c3',
    descripcion: 'Gifts para la fiesta de la Serpiente de Piedra',
    montoTotal: 2400,
    fecha: '2026-02-20',
    categoria: 'entretenimiento',
    pagadoPor: 'Cersei Lannister',
    estado: 'saldado',
    participantes: [
      { nombre: 'Cersei Lannister', monto: 800, pagado: true, pagadoEn: '2026-02-20' },
      { nombre: 'Jaime Lannister',  monto: 800, pagado: true, pagadoEn: '2026-02-21' },
      { nombre: 'Tyrion Lannister', monto: 800, pagado: true, pagadoEn: '2026-02-22' },
    ],
  },
];
