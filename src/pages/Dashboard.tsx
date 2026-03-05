import { Wallet, TrendingUp, AlertTriangle, Target, Clock } from 'lucide-react';
import { Header } from '../components/layout/Header.tsx';
import { Card } from '../components/ui/Card.tsx';
import { DataState } from '../components/ui/DataState.tsx';
import { ErrorState } from '../components/ui/ErrorState.tsx';
import { CATEGORIA_COLORS } from '../data/mockData.ts';
import { useAlerts } from '../hooks/useAlerts.ts';
import { useFormatting } from '../hooks/useFormatting.ts';
import { useCompartidosStore } from '../store/compartidosStore.ts';
import { useGastosStore } from '../store/gastosStore.ts';
import { usePresupuestosStore } from '../store/presupuestosStore.ts';
import styles from './Dashboard.module.css';

export function Dashboard() {
  const gastos = useGastosStore((s) => s.gastos);
  const getGastosFiltrados = useGastosStore((s) => s.getGastosFiltrados);
  const getTotalMes = useGastosStore((s) => s.getTotalMes);
  const loadGastos = useGastosStore((s) => s.loadGastos);
  const gastosError = useGastosStore((s) => s.error);
  const gastosLoading = useGastosStore((s) => s.loading);

  const presupuestos = usePresupuestosStore((s) => s.presupuestos);
  const loadPresupuestos = usePresupuestosStore((s) => s.loadPresupuestos);
  const presupuestosError = usePresupuestosStore((s) => s.error);
  const presupuestosLoading = usePresupuestosStore((s) => s.loading);

  const loadCompartidos = useCompartidosStore((s) => s.loadGastos);
  const compartidosError = useCompartidosStore((s) => s.error);
  const compartidosLoading = useCompartidosStore((s) => s.loading);

  const { formatCurrency, formatDate } = useFormatting();
  const alertas = useAlerts();

  const totalMes = getTotalMes();
  const gastosRecientes = getGastosFiltrados().slice(0, 6);
  const totalPresupuestado = presupuestos.reduce((acc, presupuesto) => acc + presupuesto.montoLimite, 0);
  const excedidos = presupuestos.filter((presupuesto) => presupuesto.montoGastado >= presupuesto.montoLimite).length;
  const vencenProximos = alertas.filter((alerta) => alerta.tipo === 'vencimiento').length;

  const showInitialLoading = (
    (gastosLoading || presupuestosLoading || compartidosLoading)
    && gastos.length === 0
    && presupuestos.length === 0
    && !gastosError
    && !presupuestosError
    && !compartidosError
  );

  return (
    <>
      <Header title="El Gran Libro de Gastos" subtitle="Resumen del reino" />

      {showInitialLoading && (
        <DataState
          className={styles.errorState}
          variant="loading"
          title="Actualizando resumen"
          message="Cargando gastos, presupuestos y compartidos."
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
          onRetry={loadPresupuestos}
          retrying={presupuestosLoading}
        />
      )}
      {compartidosError && (
        <ErrorState
          className={styles.errorState}
          message={`No se pudieron cargar los compartidos: ${compartidosError}`}
          onRetry={loadCompartidos}
          retrying={compartidosLoading}
        />
      )}

      <div className={styles.grid}>
        <div className={`${styles.statCard} ${styles.gold}`}>
          <Wallet size={40} className={styles.statIcon} color="var(--got-gold)" />
          <p className={styles.statLabel}>
            <Wallet size={12} /> Gastado este mes
          </p>
          <p className={`${styles.statValue} ${styles.gold}`}>{formatCurrency(totalMes)}</p>
          <p className={styles.statSub}>{gastos.length} transacciones totales</p>
        </div>

        <div className={`${styles.statCard} ${styles.blue}`}>
          <Target size={40} className={styles.statIcon} color="var(--got-blue)" />
          <p className={styles.statLabel}>
            <Target size={12} /> Presupuestado
          </p>
          <p className={styles.statValue}>{formatCurrency(totalPresupuestado)}</p>
          <p className={styles.statSub}>{presupuestos.length} presupuestos activos</p>
        </div>

        <div className={`${styles.statCard} ${styles.green}`}>
          <TrendingUp size={40} className={styles.statIcon} color="var(--got-green)" />
          <p className={styles.statLabel}>
            <TrendingUp size={12} /> Disponible
          </p>
          <p className={`${styles.statValue} ${styles.green}`}>
            {formatCurrency(Math.max(0, totalPresupuestado - totalMes))}
          </p>
          <p className={styles.statSub}>Del presupuesto total</p>
        </div>

        <div className={`${styles.statCard} ${styles.red}`}>
          <AlertTriangle size={40} className={styles.statIcon} color="var(--got-red)" />
          <p className={styles.statLabel}>
            <AlertTriangle size={12} /> Alertas urgentes
          </p>
          <p className={`${styles.statValue} ${styles.red}`}>{alertas.filter((alerta) => alerta.urgente).length}</p>
          <p className={styles.statSub}>
            {excedidos} pres. excedidos - {vencenProximos} vencen pronto
          </p>
        </div>
      </div>

      <div className={styles.bottomGrid}>
        <Card title="Alertas del Reino" elevated>
          {alertas.length === 0 ? (
            <DataState
              className={styles.inlineState}
              variant="empty"
              title="Sin alertas activas"
              message="No hay riesgos urgentes por ahora."
            />
          ) : (
            alertas.slice(0, 5).map((alerta) => (
              <div key={alerta.id} className={styles.alertItem}>
                <div className={styles.alertItemIcon}>
                  <Clock
                    size={15}
                    color={alerta.urgente ? 'var(--got-red-light)' : 'var(--got-gold-dim)'}
                  />
                </div>
                <div>
                  <p className={styles.alertItemTitle}>{alerta.titulo}</p>
                  <p className={styles.alertItemMsg}>{alerta.mensaje}</p>
                </div>
              </div>
            ))
          )}
        </Card>

        <Card title="Gastos recientes" elevated>
          {gastosRecientes.length === 0 ? (
            <DataState
              className={styles.inlineState}
              variant="empty"
              title="Sin gastos en el mes actual"
              message="Agrega un gasto para empezar a ver movimientos."
            />
          ) : (
            gastosRecientes.map((gasto) => (
              <div key={gasto.id} className={styles.recentItem}>
                <div className={styles.recentLeft}>
                  <span
                    className={styles.catDot}
                    style={{ background: CATEGORIA_COLORS[gasto.categoria] ?? '#94a3b8' }}
                  />
                  <div>
                    <p className={styles.recentDesc}>{gasto.descripcion}</p>
                    <p className={styles.recentDate}>
                      {formatDate(gasto.fecha, { day: 'numeric', month: 'short' })}
                      {gasto.cuentaVence && ' - vence'}
                    </p>
                  </div>
                </div>
                <span className={styles.recentAmount}>{formatCurrency(gasto.monto)}</span>
              </div>
            ))
          )}
        </Card>
      </div>
    </>
  );
}
