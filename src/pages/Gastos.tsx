import { useMemo, useState } from 'react';
import { Clock, Pencil, Plus, Trash2 } from 'lucide-react';
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
  const { formatCurrency, formatDate, formatMonthLabel } = useFormatting();

  const {
    getGastosFiltrados,
    deleteGasto,
    gastos: allGastos,
    filtroCategoria,
    filtroMes,
    setFiltroCategoria,
    setFiltroMes,
    getTotalMes,
    loadGastos,
    error,
    loading,
  } = useGastosStore();

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

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <select
            className={styles.filterSelect}
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
          >
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
          >
            <option value="todas">Todas las categorias</option>
            {CATEGORIAS.map((categoria) => (
              <option key={categoria.tipo} value={categoria.tipo}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </div>

        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Nuevo Gasto
        </Button>
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
