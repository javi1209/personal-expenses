import {
  Utensils,
  Car,
  Home,
  Gamepad2,
  HeartPulse,
  BookOpen,
  Shirt,
  Zap,
  CircleDot,
} from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import { Header } from '../components/layout/Header.tsx';
import { DataState } from '../components/ui/DataState.tsx';
import { CATEGORIAS, CATEGORIA_COLORS } from '../data/mockData.ts';
import { useFormatting } from '../hooks/useFormatting.ts';
import { useGastosStore } from '../store/gastosStore.ts';
import { type CategoriaType } from '../types/index.ts';
import styles from './Categorias.module.css';

const ICON_MAP: Record<string, LucideIcon> = {
  alimentacion: Utensils,
  transporte: Car,
  vivienda: Home,
  entretenimiento: Gamepad2,
  salud: HeartPulse,
  educacion: BookOpen,
  ropa: Shirt,
  servicios: Zap,
  otros: CircleDot,
};

export function Categorias() {
  const gastos = useGastosStore((s) => s.gastos);
  const loading = useGastosStore((s) => s.loading);
  const { formatCurrency } = useFormatting();

  const stats = CATEGORIAS.map((cat) => {
    const catGastos = gastos.filter((gasto) => gasto.categoria === cat.tipo);
    const total = catGastos.reduce((acc, gasto) => acc + gasto.monto, 0);
    return { ...cat, total, count: catGastos.length };
  });

  const maxTotal = Math.max(...stats.map((stat) => stat.total), 1);

  return (
    <>
      <Header title="Las Casas del Reino" subtitle="Categorias de gastos" />
      {loading && gastos.length === 0 ? (
        <DataState
          variant="loading"
          title="Cargando categorias"
          message="Estamos calculando distribucion por categoria."
        />
      ) : gastos.length === 0 ? (
        <DataState
          variant="empty"
          title="Sin datos para categorias"
          message="Registra tus primeros gastos para ver este resumen."
        />
      ) : (
        <div className={styles.grid}>
          {stats.map((cat) => {
            const Icon = ICON_MAP[cat.tipo] ?? CircleDot;
            const color = CATEGORIA_COLORS[cat.tipo as CategoriaType] ?? '#94a3b8';
            const pct = (cat.total / maxTotal) * 100;
            return (
              <div key={cat.id} className={styles.catCard}>
                <div
                  className={styles.catIcon}
                  style={{ background: `${color}22`, borderColor: `${color}55` }}
                >
                  <Icon size={24} color={color} />
                </div>
                <p className={styles.catName}>{cat.nombre}</p>
                <p className={styles.catTotal}>{formatCurrency(cat.total)}</p>
                <p className={styles.catCount}>
                  {cat.count} gasto{cat.count !== 1 ? 's' : ''}
                </p>
                <div className={styles.bar}>
                  <div className={styles.barFill} style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
