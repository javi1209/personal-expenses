import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';
import { Header } from '../components/layout/Header.tsx';
import { Card } from '../components/ui/Card.tsx';
import { DataState } from '../components/ui/DataState.tsx';
import { ErrorState } from '../components/ui/ErrorState.tsx';
import { CATEGORIAS, CATEGORIA_COLORS } from '../data/mockData.ts';
import { useFormatting } from '../hooks/useFormatting.ts';
import { reportesApi } from '../services/api.ts';
import { useGastosStore } from '../store/gastosStore.ts';
import { usePresupuestosStore } from '../store/presupuestosStore.ts';
import styles from './Reportes.module.css';

interface TrendPoint {
  mes: string;
  Gastos: number;
  Presupuesto: number;
}

export function Reportes() {
  const gastos = useGastosStore((s) => s.gastos);
  const loadGastos = useGastosStore((s) => s.loadGastos);
  const gastosError = useGastosStore((s) => s.error);
  const gastosLoading = useGastosStore((s) => s.loading);

  const presupuestos = usePresupuestosStore((s) => s.presupuestos);
  const presupuestosError = usePresupuestosStore((s) => s.error);
  const presupuestosLoading = usePresupuestosStore((s) => s.loading);

  const [datosTendencia, setDatosTendencia] = useState<TrendPoint[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsError, setTrendsError] = useState<string | null>(null);

  const {
    formatCurrency,
    formatCurrencyCompact,
    formatMonthLabel,
  } = useFormatting();

  useEffect(() => {
    const fetchTrends = async () => {
      setTrendsLoading(true);
      try {
        const { data } = await reportesApi.getTendencia(12);
        const formatted = data.map(item => ({
          ...item,
          mes: formatMonthLabel(item.mes, { month: 'short' }).replace('.', '')
        }));
        setDatosTendencia(formatted);
        setTrendsError(null);
      } catch (err) {
        setTrendsError(err instanceof Error ? err.message : 'Error al cargar tendencias');
      } finally {
        setTrendsLoading(false);
      }
    };

    void fetchTrends();
  }, [formatMonthLabel]);

  const datosPie = CATEGORIAS.map((categoria) => ({
    name: categoria.nombre,
    value: gastos
      .filter((gasto) => gasto.categoria === categoria.tipo)
      .reduce((acc, gasto) => acc + gasto.monto, 0),
    color: CATEGORIA_COLORS[categoria.tipo] ?? '#94a3b8',
  })).filter((dato) => dato.value > 0);

  const gastoPorCategoria = gastos.reduce<Record<string, number>>((acc, gasto) => {
    acc[gasto.categoria] = (acc[gasto.categoria] ?? 0) + gasto.monto;
    return acc;
  }, {});

  const datosBar = presupuestos.map((presupuesto) => ({
    name: presupuesto.categoriaLabel.slice(0, 8),
    Gastado: gastoPorCategoria[presupuesto.categoria] ?? presupuesto.montoGastado,
    Limite: presupuesto.montoLimite,
  }));

  const showInitialLoading = (
    (gastosLoading || presupuestosLoading || trendsLoading)
    && gastos.length === 0
    && presupuestos.length === 0
    && !gastosError
    && !presupuestosError
  );

  const showEmptyCharts = !showInitialLoading && datosPie.length === 0 && datosBar.length === 0;

  const RenderTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: { name: string; value: number; color: string }[];
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className={styles.customTooltip}>
        {label && <p className={styles.tooltipLabel}>{label}</p>}
        {payload.map((point) => (
          <p key={point.name} style={{ color: point.color }}>
            {point.name}: {formatCurrency(point.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <>
      <Header title="Cronicas del Reino" subtitle="Reportes y analisis financiero" />

      {showInitialLoading && (
        <DataState
          className={styles.errorState}
          variant="loading"
          title="Cargando reportes"
          message="Estamos consolidando datos historicos para los graficos."
        />
      )}

      {gastosError && (
        <ErrorState
          className={styles.errorState}
          message={`No se pudieron cargar los gastos: ${gastosError}`}
          onRetry={loadGastos}
          retrying={gastosLoading}
        />
      )}
      {presupuestosError && (
        <ErrorState
          className={styles.errorState}
          message={`No se pudieron cargar los presupuestos: ${presupuestosError}`}
          onRetry={() => window.location.reload()}
        />
      )}
      {trendsError && (
        <ErrorState
          className={styles.errorState}
          message={`No se pudieron cargar las tendencias: ${trendsError}`}
          onRetry={() => window.location.reload()}
        />
      )}

      {showEmptyCharts ? (
        <DataState
          variant="empty"
          title="Sin datos para reportes"
          message="Agrega gastos y presupuestos para habilitar analisis y tendencias."
        />
      ) : (
        <div className={styles.grid}>
          <Card>
            <p className={styles.chartTitle}>Distribucion por Categoria</p>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={datosPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name.slice(0, 6)} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {datosPie.map((dato, index) => (
                    <Cell key={index} fill={dato.color} stroke="var(--got-surface)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<RenderTooltip />} formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <p className={styles.chartTitle}>Presupuesto vs Gastado</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={datosBar} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--got-border)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'var(--got-text-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--got-text-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => formatCurrencyCompact(value)}
                />
                <Tooltip content={<RenderTooltip />} formatter={(value: number) => formatCurrency(value)} />
                <Legend
                  wrapperStyle={{
                    fontFamily: 'var(--font-data)',
                    fontSize: 12,
                    color: 'var(--got-text-muted)',
                  }}
                />
                <Bar dataKey="Gastado" fill="var(--got-red)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Limite" fill="var(--got-gold-dim)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className={styles.fullRow}>
            <p className={styles.chartTitle}>Tendencia de Gastos Mensual</p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={datosTendencia} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--got-border)" />
                <XAxis
                  dataKey="mes"
                  tick={{ fill: 'var(--got-text-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--got-text-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => formatCurrencyCompact(value)}
                />
                <Tooltip content={<RenderTooltip />} formatter={(value: number) => formatCurrency(value)} />
                <Legend
                  wrapperStyle={{
                    fontFamily: 'var(--font-data)',
                    fontSize: 12,
                    color: 'var(--got-text-muted)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="Gastos"
                  stroke="var(--got-gold)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--got-gold)', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="Presupuesto"
                  stroke="var(--got-red)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      <Card title="Resumen por Categoria">
        {datosPie.length === 0 ? (
          <DataState
            variant="empty"
            title="Sin resumen disponible"
            message="Todavia no hay gastos para calcular distribucion por categoria."
          />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--got-border-gold)' }}>
                {['Categoria', 'Gastos', 'Total Gastado', '% del Total'].map((header) => (
                  <th
                    key={header}
                    style={{
                      fontFamily: 'var(--font-data)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--got-text-muted)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: 'var(--space-3) var(--space-4)',
                      textAlign: 'left',
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {datosPie.map((dato) => {
                const totalAll = datosPie.reduce((acc, current) => acc + current.value, 0);
                const catGastos = gastos.filter(
                  (gasto) => CATEGORIAS.find((categoria) => categoria.nombre === dato.name)?.tipo === gasto.categoria
                );
                return (
                  <tr key={dato.name} style={{ borderBottom: '1px solid var(--got-border-dim)' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: dato.color,
                            flexShrink: 0,
                            display: 'inline-block',
                          }}
                        />
                        <span
                          style={{
                            fontFamily: 'var(--font-data)',
                            fontSize: 'var(--text-sm)',
                            color: 'var(--got-text)',
                          }}
                        >
                          {dato.name}
                        </span>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: 'var(--space-3) var(--space-4)',
                        fontFamily: 'var(--font-data)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--got-text-muted)',
                      }}
                    >
                      {catGastos.length}
                    </td>
                    <td
                      style={{
                        padding: 'var(--space-3) var(--space-4)',
                        fontFamily: 'var(--font-data)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 700,
                        color: 'var(--got-text-light)',
                      }}
                    >
                      {formatCurrency(dato.value)}
                    </td>
                    <td
                      style={{
                        padding: 'var(--space-3) var(--space-4)',
                        fontFamily: 'var(--font-data)',
                        fontSize: 'var(--text-sm)',
                        color: dato.color,
                      }}
                    >
                      {((dato.value / totalAll) * 100).toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
