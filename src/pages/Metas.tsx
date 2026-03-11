import { useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2, Coins, TrendingUp, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '../components/layout/Header.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Card } from '../components/ui/Card.tsx';
import { DataState } from '../components/ui/DataState.tsx';
import { ErrorState } from '../components/ui/ErrorState.tsx';
import { Input } from '../components/ui/Input.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { useFormatting } from '../hooks/useFormatting.ts';
import { useMetasStore } from '../store/metasStore.ts';
import { type MetaAhorro } from '../types/index.ts';
import styles from './Metas.module.css';

export function Metas() {
  const [modalOpen, setModalOpen] = useState(false);
  const [aporteModalOpen, setAporteModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMetaId, setSelectedMetaId] = useState<string | null>(null);
  const { currency, formatCurrency, formatDate } = useFormatting();
  const {
    metas,
    addMeta,
    updateMeta,
    deleteMeta,
    addAporte,
    loadMetas,
    error,
    loading,
  } = useMetasStore();

  const [form, setForm] = useState({
    nombre: '',
    montoObjetivo: 0,
    fechaLimite: '',
    color: '#94a3b8',
  });

  const [aporteForm, setAporteForm] = useState({
    monto: 0,
    fecha: new Date().toISOString().split('T')[0],
    notas: '',
  });

  const setField = (key: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setAporteField = (key: string, value: unknown) =>
    setAporteForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.nombre.trim()) {
      toast.error('Nombre requerido');
      return;
    }
    if (form.montoObjetivo <= 0) {
      toast.error('Monto objetivo debe ser mayor a 0');
      return;
    }
    if (!form.fechaLimite) {
      toast.error('Fecha limite requerida');
      return;
    }

    try {
      if (editingId) {
        await updateMeta(editingId, {
          nombre: form.nombre,
          montoObjetivo: Number(form.montoObjetivo),
          fechaLimite: form.fechaLimite,
          color: form.color,
        });
        toast.success('Meta actualizada');
      } else {
        await addMeta({
          nombre: form.nombre,
          montoObjetivo: Number(form.montoObjetivo),
          fechaLimite: form.fechaLimite,
          color: form.color,
        });
        toast.success('Meta creada');
      }
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error en la operacion';
      toast.error(message);
    }
  };

  const handleAporteSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedMetaId) return;

    if (aporteForm.monto <= 0) {
      toast.error('Monto debe ser mayor a 0');
      return;
    }

    try {
      await addAporte(selectedMetaId, {
        monto: Number(aporteForm.monto),
        fecha: aporteForm.fecha,
        notas: aporteForm.notas,
      });
      toast.success('Aporte registrado');
      handleAporteClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al registrar aporte';
      toast.error(message);
    }
  };

  const handleEdit = (meta: MetaAhorro) => {
    setEditingId(meta.id);
    setForm({
      nombre: meta.nombre,
      montoObjetivo: meta.montoObjetivo,
      fechaLimite: meta.fechaLimite,
      color: meta.color,
    });
    setModalOpen(true);
  };

  const handleClose = () => {
    setEditingId(null);
    setForm({
      nombre: '',
      montoObjetivo: 0,
      fechaLimite: '',
      color: '#94a3b8',
    });
    setModalOpen(false);
  };

  const handleAporteClose = () => {
    setSelectedMetaId(null);
    setAporteForm({
      monto: 0,
      fecha: new Date().toISOString().split('T')[0],
      notas: '',
    });
    setAporteModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar esta meta?')) return;
    try {
      await deleteMeta(id);
      toast.success('Meta eliminada');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo eliminar la meta';
      toast.error(message);
    }
  };

  const openAporteModal = (id: string) => {
    setSelectedMetaId(id);
    setAporteModalOpen(true);
  };

  return (
    <>
      <Header title="Metas de Ahorro" subtitle="Ahorra para tus sueños" />

      <div className={styles.toolbar}>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Nueva Meta
        </Button>
      </div>

      {error && (
        <ErrorState
          className={styles.errorState}
          message={error}
          onRetry={loadMetas}
          retrying={loading}
        />
      )}

      {loading && metas.length === 0 ? (
        <DataState
          className={styles.emptyState}
          variant="loading"
          title="Cargando metas"
          message="Traemos tus planes de ahorro."
        />
      ) : metas.length === 0 ? (
        error ? null : (
          <DataState
            className={styles.emptyState}
            variant="empty"
            title="Sin metas configuradas"
            message="No hay metas de ahorro registradas"
          />
        )
      ) : (
        <div className={styles.grid}>
          {metas.map((meta) => {
            const pct = Math.min((meta.montoActual / meta.montoObjetivo) * 100, 100);
            const canAddProgress = !meta.lograda;

            // Calculo de ahorro mensual necesario
            const now = new Date();
            const deadline = new Date(meta.fechaLimite);
            const diffTime = deadline.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const diffMonths = diffDays / 30;
            
            const remainingMonto = meta.montoObjetivo - meta.montoActual;
            const monthlyNeeded = remainingMonto > 0 && diffMonths > 0 
              ? remainingMonto / diffMonths 
              : 0;

            return (
              <Card key={meta.id} className={`${styles.metaCard} ${meta.lograda ? styles.lograda : ''}`}>
                <div className={styles.metaHeader}>
                  <div className={styles.titleArea}>
                    <p className={styles.metaTitle}>{meta.nombre}</p>
                    <p className={styles.metaDeadline}>Vence: {formatDate(meta.fechaLimite)}</p>
                  </div>
                  <div className={styles.actions}>
                    {meta.lograda && <CheckCircle2 className={styles.logradaIcon} size={20} />}
                    <button
                      className={styles.editBtn}
                      onClick={() => handleEdit(meta)}
                      aria-label="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => void handleDelete(meta.id)}
                      aria-label="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className={styles.amounts}>
                  <div className={styles.current}>
                    <Coins size={14} />
                    <span>{formatCurrency(meta.montoActual)}</span>
                  </div>
                  <div className={styles.target}>
                    <span>de {formatCurrency(meta.montoObjetivo)}</span>
                  </div>
                </div>

                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: meta.color,
                    }}
                  />
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.pctText}>{Math.round(pct)}% alcanzado</span>
                  {remainingMonto > 0 && !meta.lograda && diffDays > 0 && (
                    <span className={styles.neededText}>
                      Necesitas {formatCurrency(monthlyNeeded)}/mes
                    </span>
                  )}
                </div>

                <div className={styles.footer}>
                  <div className={styles.statusArea}>
                    {!meta.lograda && diffDays < 0 && (
                      <Badge color="red">Atrasada</Badge>
                    )}
                    {!meta.lograda && diffDays >= 0 && pct > 50 && (
                      <Badge color="gold">¡Casi listo!</Badge>
                    )}
                  </div>
                  {canAddProgress && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openAporteModal(meta.id)}
                      className={styles.aporteBtn}
                    >
                      <TrendingUp size={14} /> Aportar
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={handleClose}
        title={editingId ? 'Editar Meta' : 'Nueva Meta'}
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            label="Nombre de la meta"
            placeholder="Ej: Viaje a Europa, Nuevo PC..."
            required
            value={form.nombre}
            onChange={(e) => setField('nombre', e.target.value)}
          />

          <div className={styles.row}>
            <Input
              label={`Monto objetivo (${currency})`}
              required
              type="number"
              min={1}
              value={form.montoObjetivo || ''}
              onChange={(e) => setField('montoObjetivo', e.target.value)}
            />
            <Input
              label="Fecha limite"
              required
              type="date"
              value={form.fechaLimite}
              onChange={(e) => setField('fechaLimite', e.target.value)}
            />
          </div>

          <Input
            label="Color"
            type="color"
            value={form.color}
            onChange={(e) => setField('color', e.target.value)}
          />

          <div className={styles.actions}>
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingId ? 'Guardar Cambios' : 'Crear Meta'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={aporteModalOpen}
        onClose={handleAporteClose}
        title="Registrar Aporte"
      >
        <form className={styles.form} onSubmit={handleAporteSubmit}>
          <Input
            label={`Monto del aporte (${currency})`}
            required
            type="number"
            min={0.01}
            step="0.01"
            value={aporteForm.monto || ''}
            onChange={(e) => setAporteField('monto', e.target.value)}
          />
          <Input
            label="Fecha"
            required
            type="date"
            value={aporteForm.fecha}
            onChange={(e) => setAporteField('fecha', e.target.value)}
          />
          <Input
            label="Notas (opcional)"
            value={aporteForm.notas}
            onChange={(e) => setAporteField('notas', e.target.value)}
          />

          <div className={styles.actions}>
            <Button type="button" variant="ghost" onClick={handleAporteClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Registrar Aporte
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
