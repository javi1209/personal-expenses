import { useMemo, useState } from 'react';
import { Clock, Download, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '../components/layout/Header.tsx';
import { GastoForm } from '../components/gastos/GastoForm.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Card } from '../components/ui/Card.tsx';
import { DataState } from '../components/ui/DataState.tsx';
import { ErrorState } from '../components/ui/ErrorState.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { useFormatting } from '../hooks/useFormatting.ts';
import { CATEGORIAS, CATEGORIA_COLORS } from '../data/mockData.ts';
import { adminApi } from '../services/api.ts';
import { useGastosStore } from '../store/gastosStore.ts';
import { type CategoriaType, type Gasto } from '../types/index.ts';
import styles from './Gastos.module.css';

const MONTH_OPTIONS_COUNT = 18;

const monthToValue = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}`;
};

const buildMonthOptions = (count: number): string[] => {
  const base = new Date();
  base.setDate(1);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(base);
    date.setMonth(base.getMonth() - index);
    return monthToValue(date);
  }).reverse();
};

const BASE_MONTH_OPTIONS = buildMonthOptions(MONTH_OPTIONS_COUNT);

export function Gastos() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Gasto | undefined>(undefined);
  const [recurrenteLoading, setRecurrenteLoading] = useState(false);
  const [recurrenteMsg, setRecurrenteMsg] = useState<string | null>(null);
  const { formatCurrency, formatDate, formatMonthLabel } = useFormatting();

  const {
    getGastosFiltrados,
    deleteGasto,
    gastos: allGastos,
    filtroCategoria,
    filtroMes,
    searchQuery,
    montoMin,
    montoMax,
    setFiltroCategoria,
    setFiltroMes,
    setSearchQuery,
    setMontoMin,
    setMontoMax,
    getTotalMes,
    loadGastos,
    error,
    loading,
  } = useGastosStore();

  const tieneRecurrentes = allGastos.some((g) => g.esRecurrente);

  const handleGenerarRecurrentes = async () => {
    setRecurrenteLoading(true);
    setRecurrenteMsg(null);
    try {
      const { data } = await adminApi.generarRecurrentes();
      if (data.yaGenerado) {
        setRecurrenteMsg(`✓ Ya estaban generados para ${data.mes}`);
      } else if (data.generados === 0) {
        setRecurrenteMsg(`Sin recurrentes del mes anterior para copiar`);
      } else {
        setRecurrenteMsg(`✓ ${data.generados} gasto${data.generados !== 1 ? 's' : ''} generado${data.generados !== 1 ? 's' : ''} para ${data.mes}`);
        toast.success(`${data.generados} recurrentes generados para ${data.mes}`);
        await loadGastos();
      }
    } catch {
      setRecurrenteMsg('Error al generar recurrentes');
      toast.error('No se pudieron generar los recurrentes');
    } finally {
      setRecurrenteLoading(false);
    }
  };

  const gastos = getGastosFiltrados();
  const total = getTotalMes();
  const mesesDisponibles = useMemo(
    () =>
      Array.from(
        new Set([
          ...BASE_MONTH_OPTIONS,
          ...allGastos.map((gasto) => gasto.fecha.slice(0, 7)),
          filtroMes,
        ])
      )
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [allGastos, filtroMes]
  );

  const handleDelete = async (gasto: Gasto) => {
    if (!window.confirm(`Eliminar "${gasto.descripcion}"?`)) return;

    try {
      await deleteGasto(gasto.id);
      toast.success('Gasto eliminado del registro');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo eliminar el gasto';
      toast.error(message);
    }
  };

  const handleExportCSV = () => {
    if (gastos.length === 0) {
      toast.error('No hay gastos para exportar');
      return;
    }

    const headers = ['Fecha', 'Descripción', 'Categoría', 'Monto', 'Recurrente', 'Notas'];
    const rows = gastos.map((g) => [
      g.fecha,
      `"${g.descripcion.replace(/"/g, '""')}"`,
      `"${g.categoriaLabel.replace(/"/g, '""')}"`,
      g.monto.toString(),
      g.esRecurrente ? 'Sí' : 'No',
      `"${(g.notas || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `gastos_export_${filtroMes}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Exportación completada');
  };

  const handleEdit = (gasto: Gasto) => {
    setEditing(gasto);
    setModalOpen(true);
  };

  const handleClose = () => {
    setEditing(undefined);
    setModalOpen(false);
  };

  const fmt = (value: number): string => formatCurrency(value);

  return (
    <>
      <Header title="Registro de Gastos" subtitle="Todos los tributos del reino" />

      {tieneRecurrentes && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-4)',
          marginBottom: 'var(--space-2)',
          background: 'var(--got-surface)',
          border: '1px solid var(--got-border)',
          borderRadius: 'var(--radius-md)',
          flexWrap: 'wrap',
        }}>
          <RefreshCw size={14} style={{ color: 'var(--got-gold)', flexShrink: 0 }} />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--got-text-muted)', flex: 1 }}>
            {recurrenteMsg ?? 'Tenés gastos recurrentes. Generálos al inicio de cada mes con un clic.'}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void handleGenerarRecurrentes()}
            disabled={recurrenteLoading}
          >
            {recurrenteLoading ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={13} />}
            {recurrenteLoading ? 'Generando...' : 'Generar recurrentes'}
          </Button>
        </div>
      )}

      <div className={styles.toolbar} style={{ flexWrap: 'wrap' }}>
        <div className={styles.filters} style={{ width: '100%', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--got-text-muted)' }}
            />
            <input
              type="text"
              placeholder="Buscar gasto por desc..."
              className={styles.filterSelect}
              style={{ paddingLeft: 36, width: '100%', boxSizing: 'border-box' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className={styles.filterSelect}
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
            style={{ flex: '1 1 140px' }}
          >
            <option value="todos">Todos los meses</option>
            {mesesDisponibles.map((mes) => (
              <option key={mes} value={mes}>
                {formatMonthLabel(mes, { month: 'long', year: 'numeric' })}
              </option>
            ))}
          </select>

          <select
            className={styles.filterSelect}
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value as CategoriaType | 'todas')}
            style={{ flex: '1 1 180px' }}
          >
            <option value="todas">Todas las categorías</option>
            {CATEGORIAS.map((categoria) => (
              <option key={categoria.tipo} value={categoria.tipo}>
                {categoria.nombre}
              </option>
            ))}
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 200px' }}>
            <input
              type="number"
              placeholder="Mín $"
              className={styles.filterSelect}
              style={{ width: '100%' }}
              value={montoMin === null ? '' : montoMin}
              onChange={(e) => setMontoMin(e.target.value ? Number(e.target.value) : null)}
            />
            <span style={{ color: 'var(--got-text-muted)' }}>-</span>
            <input
              type="number"
              placeholder="Máx $"
              className={styles.filterSelect}
              style={{ width: '100%' }}
              value={montoMax === null ? '' : montoMax}
              onChange={(e) => setMontoMax(e.target.value ? Number(e.target.value) : null)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <Button onClick={handleExportCSV} variant="ghost">
            <Download size={16} /> Exportar CSV
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Nuevo Gasto
          </Button>
        </div>
      </div>

      <Card noPad>
        {error && (
          <div className={styles.errorState}>
            <ErrorState message={error} onRetry={loadGastos} retrying={loading} />
          </div>
        )}

        {loading && gastos.length === 0 ? (
          <div className={styles.statePanel}>
            <DataState
              variant="loading"
              title="Cargando gastos"
              message="Estamos consultando tus movimientos mas recientes."
            />
          </div>
        ) : gastos.length === 0 ? (
          error ? null : (
            <div className={styles.statePanel}>
              <DataState
                variant="empty"
                title="Sin gastos en este periodo"
                message="No hay gastos registrados para este periodo"
              />
            </div>
          )
        ) : (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Descripcion</th>
                    <th>Categoria</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'right' }}>Monto</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {gastos.map((gasto) => (
                    <tr key={gasto.id}>
                      <td>
                        <div>{gasto.descripcion}</div>
                        {gasto.notas && (
                          <div
                            style={{
                              fontSize: 'var(--text-xs)',
                              color: 'var(--got-text-dim)',
                              marginTop: 2,
                            }}
                          >
                            {gasto.notas}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className={styles.catCell}>
                          <span
                            className={styles.catDot}
                            style={{ background: CATEGORIA_COLORS[gasto.categoria] ?? '#94a3b8' }}
                          />
                          {gasto.categoriaLabel}
                        </div>
                      </td>
                      <td>
                        {formatDate(gasto.fecha, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                          {gasto.esRecurrente && <Badge color="gold">Recurrente</Badge>}
                          {gasto.cuentaVence && (
                            <Badge color="red">
                              <Clock size={10} />
                              Vence{' '}
                              {formatDate(gasto.cuentaVence, {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </Badge>
                          )}
                          {gasto.esCompartido && <Badge color="blue">Compartido</Badge>}
                        </div>
                      </td>
                      <td className={styles.amount}>{fmt(gasto.monto)}</td>
                      <td>
                        <div className={styles.actions}>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(gasto)}
                            aria-label="Editar"
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            size="icon"
                            variant="danger"
                            onClick={() => void handleDelete(gasto)}
                            aria-label="Eliminar"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.total}>
              <span className={styles.totalLabel}>Total del periodo</span>
              <span className={styles.totalValue}>{fmt(total)}</span>
            </div>
          </>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={handleClose}
        title={editing ? 'Editar Gasto' : 'Nuevo Gasto'}
      >
        <GastoForm onClose={handleClose} initial={editing} />
      </Modal>
    </>
  );
}
