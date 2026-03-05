import { useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '../components/layout/Header.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { Button } from '../components/ui/Button.tsx';
import { DataState } from '../components/ui/DataState.tsx';
import { ErrorState } from '../components/ui/ErrorState.tsx';
import { Input, Select } from '../components/ui/Input.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { useFormatting } from '../hooks/useFormatting.ts';
import { CATEGORIAS } from '../data/mockData.ts';
import { usePresupuestosStore } from '../store/presupuestosStore.ts';
import { type CategoriaType, type PeriodoPresupuesto } from '../types/index.ts';
import styles from './Presupuestos.module.css';

const CAT_OPTIONS = CATEGORIAS.map((c) => ({ value: c.tipo, label: c.nombre }));

const PERIODO_OPTIONS = [
  { value: 'mensual', label: 'Mensual' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'anual', label: 'Anual' },
];

export function Presupuestos() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { currency, formatCurrency } = useFormatting();
  const {
    presupuestos,
    addPresupuesto,
    updatePresupuesto,
    deletePresupuesto,
    loadPresupuestos,
    error,
    loading,
  } = usePresupuestosStore();

  const [form, setForm] = useState({
    categoria: '',
    categoriaLabel: '',
    montoLimite: 0,
    periodo: 'mensual' as PeriodoPresupuesto,
    alertaUmbral: 80,
    color: '#94a3b8',
  });

  const setField = (key: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.montoLimite) {
      toast.error('Monto limite requerido');
      return;
    }

    // Al editar, permitimos no cambiar categoria (o deshabilitamos el select)
    if (!editingId && !form.categoria) {
      toast.error('Selecciona una categoria');
      return;
    }

    const categoriaLabel =
      CATEGORIAS.find((categoria) => categoria.tipo === form.categoria)?.nombre ?? form.categoria;

    try {
      if (editingId) {
        await updatePresupuesto(editingId, {
          montoLimite: Number(form.montoLimite),
          periodo: form.periodo,
          alertaUmbral: Number(form.alertaUmbral),
        });
        toast.success('Presupuesto actualizado');
      } else {
        await addPresupuesto({
          ...form,
          categoriaLabel,
          montoLimite: Number(form.montoLimite),
          alertaUmbral: Number(form.alertaUmbral),
          categoria: form.categoria as CategoriaType,
        });
        toast.success('Presupuesto establecido');
      }
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error en la operacion';
      toast.error(message);
    }
  };

  const handleEdit = (presupuesto: any) => {
    setEditingId(presupuesto.id);
    setForm({
      categoria: presupuesto.categoria,
      categoriaLabel: presupuesto.categoriaLabel,
      montoLimite: presupuesto.montoLimite,
      periodo: presupuesto.periodo,
      alertaUmbral: presupuesto.alertaUmbral,
      color: presupuesto.color,
    });
    setModalOpen(true);
  };

  const handleClose = () => {
    setEditingId(null);
    setForm({
      categoria: '',
      categoriaLabel: '',
      montoLimite: 0,
      periodo: 'mensual',
      alertaUmbral: 80,
      color: '#94a3b8',
    });
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePresupuesto(id);
      toast.success('Presupuesto eliminado');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo eliminar el presupuesto';
      toast.error(message);
    }
  };

  const fmt = (value: number): string => formatCurrency(value);

  return (
    <>
      <Header title="Presupuestos del Reino" subtitle="Limites de gasto por categoria" />

      <div className={styles.toolbar}>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Nuevo Presupuesto
        </Button>
      </div>

      {error && (
        <ErrorState
          className={styles.errorState}
          message={error}
          onRetry={loadPresupuestos}
          retrying={loading}
        />
      )}

      {loading && presupuestos.length === 0 ? (
        <DataState
          className={styles.emptyState}
          variant="loading"
          title="Cargando presupuestos"
          message="Traemos los limites configurados para tus categorias."
        />
      ) : presupuestos.length === 0 ? (
        error ? null : (
          <DataState
            className={styles.emptyState}
            variant="empty"
            title="Sin presupuestos configurados"
            message="No hay presupuestos registrados"
          />
        )
      ) : (
        <div className={styles.grid}>
          {presupuestos.map((presupuesto) => {
            const pct = Math.min((presupuesto.montoGastado / presupuesto.montoLimite) * 100, 100);
            const isWarning = pct >= presupuesto.alertaUmbral && pct < 100;
            const isDanger = pct >= 100;

            return (
              <div
                key={presupuesto.id}
                className={`${styles.presupCard} ${isDanger ? styles.excedido : ''}`}
              >
                <div className={styles.presupHeader}>
                  <div>
                    <p className={styles.presupName}>{presupuesto.categoriaLabel}</p>
                    <p className={styles.presupPeriodo}>{presupuesto.periodo}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    {isDanger && <Badge color="red">Excedido</Badge>}
                    {isWarning && <Badge color="gold">Alerta</Badge>}
                    <button
                      className={styles.editBtn}
                      onClick={() => handleEdit(presupuesto)}
                      aria-label="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => void handleDelete(presupuesto.id)}
                      aria-label="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className={styles.amounts}>
                  <span className={styles.gastado}>{fmt(presupuesto.montoGastado)}</span>
                  <span className={styles.limite}>de {fmt(presupuesto.montoLimite)}</span>
                </div>

                <div className={styles.barTrack}>
                  <div
                    className={`${styles.barFill} ${isWarning ? styles.warning : ''} ${isDanger ? styles.danger : ''
                      }`}
                    style={{
                      width: `${pct}%`,
                      background: isDanger || isWarning ? undefined : presupuesto.color,
                    }}
                  />
                </div>

                <div className={styles.pctRow}>
                  <span className={styles.pctValue}>{Math.round(pct)}% utilizado</span>
                  <span className={styles.pctValue}>Alerta al {presupuesto.alertaUmbral}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={handleClose}
        title={editingId ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          <Select
            label="Categoria"
            required
            disabled={!!editingId}
            options={CAT_OPTIONS}
            value={form.categoria}
            onChange={(e) => setField('categoria', e.target.value)}
          />

          <div className={styles.row}>
            <Input
              label={`Monto limite (${currency})`}
              required
              type="number"
              min={1}
              value={form.montoLimite || ''}
              onChange={(e) => setField('montoLimite', e.target.value)}
            />
            <Select
              label="Periodo"
              options={PERIODO_OPTIONS}
              value={form.periodo}
              onChange={(e) => setField('periodo', e.target.value)}
            />
          </div>

          <Input
            label="Umbral de alerta (%)"
            type="number"
            min={1}
            max={100}
            value={form.alertaUmbral}
            onChange={(e) => setField('alertaUmbral', e.target.value)}
            helper="Te avisamos cuando superes este porcentaje"
          />

          <div className={styles.actions}>
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingId ? 'Guardar Cambios' : 'Establecer Presupuesto'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
