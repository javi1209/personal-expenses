import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle, Circle, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '../components/layout/Header.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { Button } from '../components/ui/Button.tsx';
import { DataState } from '../components/ui/DataState.tsx';
import { ErrorState } from '../components/ui/ErrorState.tsx';
import { Input, Select, Textarea } from '../components/ui/Input.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { useFormatting } from '../hooks/useFormatting.ts';
import { CATEGORIAS, CATEGORIA_COLORS } from '../data/mockData.ts';
import { resolveEntityId } from '../services/api.ts';
import { getSocket, SOCKET_EVENTS } from '../services/socket.ts';
import { useCompartidosStore } from '../store/compartidosStore.ts';
import { type CategoriaType, type GastoCompartido } from '../types/index.ts';
import styles from './GastosCompartidos.module.css';

const CAT_OPTIONS = CATEGORIAS.map((c) => ({ value: c.tipo, label: c.nombre }));

const STATUS_COLOR: Record<string, 'gold' | 'green' | 'red'> = {
  pendiente: 'red',
  parcial: 'gold',
  saldado: 'green',
};

export function GastosCompartidos() {
  const [modalOpen, setModalOpen] = useState(false);
  const { formatCurrency, formatDate } = useFormatting();
  const {
    gastos,
    addGasto,
    marcarPagado,
    upsertGasto,
    loadGastos,
    error,
    loading,
  } = useCompartidosStore();

  useEffect(() => {
    const socket = getSocket();

    const onNuevo = (incoming: GastoCompartido) => {
      const incomingId = resolveEntityId(incoming);
      const alreadyExists = useCompartidosStore
        .getState()
        .gastos.some((gasto) => resolveEntityId(gasto) === incomingId);

      upsertGasto(incoming);
      if (!alreadyExists) {
        toast.success(`Nuevo gasto compartido: ${incoming.descripcion}`);
      }
    };

    const onActualizado = (incoming: GastoCompartido) => {
      upsertGasto(incoming);
    };

    socket.on(SOCKET_EVENTS.GASTO_COMPARTIDO_NUEVO, onNuevo);
    socket.on(SOCKET_EVENTS.GASTO_COMPARTIDO_ACTUALIZADO, onActualizado);

    return () => {
      socket.off(SOCKET_EVENTS.GASTO_COMPARTIDO_NUEVO, onNuevo);
      socket.off(SOCKET_EVENTS.GASTO_COMPARTIDO_ACTUALIZADO, onActualizado);
    };
  }, [upsertGasto]);

  const [form, setForm] = useState({
    descripcion: '',
    montoTotal: 0,
    fecha: new Date().toISOString().split('T')[0],
    categoria: 'alimentacion' as CategoriaType,
    pagadoPor: '',
    notas: '',
    participantes: [{ nombre: '', monto: 0, pagado: false }],
  });

  const setField = (key: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addParticipante = () =>
    setForm((prev) => ({
      ...prev,
      participantes: [...prev.participantes, { nombre: '', monto: 0, pagado: false }],
    }));

  const removeParticipante = (index: number) =>
    setForm((prev) => ({
      ...prev,
      participantes: prev.participantes.filter((_, i) => i !== index),
    }));

  const setParticipante = (index: number, key: string, value: unknown) =>
    setForm((prev) => {
      const next = [...prev.participantes];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, participantes: next };
    });

  const resetForm = () =>
    setForm({
      descripcion: '',
      montoTotal: 0,
      fecha: new Date().toISOString().split('T')[0],
      categoria: 'alimentacion',
      pagadoPor: '',
      notas: '',
      participantes: [{ nombre: '', monto: 0, pagado: false }],
    });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.descripcion || !form.montoTotal || !form.pagadoPor) {
      toast.error('Completa los campos requeridos');
      return;
    }

    if (form.participantes.some((p) => !p.nombre || !p.monto)) {
      toast.error('Completa todos los participantes');
      return;
    }

    try {
      await addGasto({
        ...form,
        montoTotal: Number(form.montoTotal),
        estado: 'pendiente',
        participantes: form.participantes.map((p) => ({
          ...p,
          monto: Number(p.monto),
        })),
      });
      toast.success('Gasto compartido registrado');
      setModalOpen(false);
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo registrar el gasto';
      toast.error(message);
    }
  };

  const handleMarcarPagado = async (gastoId: string, nombre: string) => {
    try {
      await marcarPagado(gastoId, nombre);
      toast.success(`${nombre} marcado como pagado`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el pago';
      toast.error(message);
    }
  };

  const fmt = (value: number): string => formatCurrency(value);

  return (
    <>
      <Header title="Gastos Compartidos" subtitle="Las deudas del reino" />

      <div className={styles.toolbar}>
        <div className={styles.liveIndicator}>
          <span className={styles.liveDot} />
          Sincronizacion en tiempo real activa
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Nuevo Gasto Compartido
        </Button>
      </div>

      {error && (
        <ErrorState
          className={styles.errorState}
          message={error}
          onRetry={loadGastos}
          retrying={loading}
        />
      )}

      {loading && gastos.length === 0 ? (
        <DataState
          className={styles.emptyState}
          variant="loading"
          title="Cargando gastos compartidos"
          message="Buscando deudas y pagos compartidos."
        />
      ) : gastos.length === 0 ? (
        error ? null : (
          <DataState
            className={styles.emptyState}
            variant="empty"
            title="Sin gastos compartidos"
            message="No hay gastos compartidos registrados"
          />
        )
      ) : (
        <div className={styles.grid}>
          {gastos.map((gasto) => (
            <div key={resolveEntityId(gasto)} className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <p className={styles.cardTitle}>{gasto.descripcion}</p>
                <p className={styles.cardMeta}>
                  {formatDate(gasto.fecha, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  {' · '}
                  <span style={{ color: CATEGORIA_COLORS[gasto.categoria] }}>
                    {CATEGORIAS.find((categoria) => categoria.tipo === gasto.categoria)?.nombre}
                  </span>
                </p>
              </div>
              <Badge color={STATUS_COLOR[gasto.estado] ?? 'muted'}>
                {gasto.estado === 'saldado'
                  ? 'Saldado'
                  : gasto.estado === 'parcial'
                    ? 'Parcial'
                    : 'Pendiente'}
              </Badge>
            </div>

            <p className={styles.total}>{fmt(gasto.montoTotal)}</p>
            <p className={styles.pagadoPor}>
              Pagado por:{' '}
              <strong style={{ color: 'var(--got-text-light)' }}>{gasto.pagadoPor}</strong>
            </p>

            <div className={styles.participantes}>
              {gasto.participantes.map((participante) => (
                <div
                  key={`${resolveEntityId(gasto)}-${participante.nombre}`}
                  className={`${styles.participante} ${participante.pagado ? styles.pagado : ''}`}
                >
                  <div className={styles.partLeft}>
                    <img
                      src={`https://i.pravatar.cc/28?u=${encodeURIComponent(participante.nombre)}`}
                      alt={participante.nombre}
                      className={styles.partAvatar}
                    />
                    <span className={styles.partName}>{participante.nombre}</span>
                  </div>
                  <div className={styles.partStatus}>
                    <span className={styles.partMonto}>{fmt(participante.monto)}</span>
                    {participante.pagado ? (
                      <CheckCircle size={16} color="var(--got-green-light)" />
                    ) : (
                      <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
                        <Circle size={16} color="var(--got-text-dim)" />
                        {gasto.estado !== 'saldado' && (
                          <button
                            className={styles.markBtn}
                            onClick={() =>
                              void handleMarcarPagado(resolveEntityId(gasto), participante.nombre)
                            }
                          >
                            Marcar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo Gasto Compartido">
        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            label="Descripcion"
            required
            value={form.descripcion}
            onChange={(e) => setField('descripcion', e.target.value)}
          />

          <div className={styles.row}>
            <Input
              label="Monto Total"
              required
              type="number"
              min={0}
              value={form.montoTotal || ''}
              onChange={(e) => setField('montoTotal', e.target.value)}
            />
            <Input
              label="Fecha"
              required
              type="date"
              value={form.fecha}
              onChange={(e) => setField('fecha', e.target.value)}
            />
          </div>

          <div className={styles.row}>
            <Select
              label="Categoria"
              options={CAT_OPTIONS}
              value={form.categoria}
              onChange={(e) => setField('categoria', e.target.value)}
            />
            <Input
              label="Pagado por"
              required
              value={form.pagadoPor}
              onChange={(e) => setField('pagadoPor', e.target.value)}
              placeholder="Nombre de quien pago"
            />
          </div>

          <div>
            <label
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: 'var(--text-xs)',
                color: 'var(--got-text-muted)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: 'var(--space-2)',
              }}
            >
              Participantes *
            </label>
            <div className={styles.partList}>
              {form.participantes.map((participante, index) => (
                <div key={index} className={styles.partRow}>
                  <Input
                    placeholder="Nombre"
                    value={participante.nombre}
                    onChange={(e) => setParticipante(index, 'nombre', e.target.value)}
                  />
                  <Input
                    placeholder="Monto"
                    type="number"
                    min={0}
                    value={participante.monto || ''}
                    onChange={(e) => setParticipante(index, 'monto', e.target.value)}
                  />
                  {form.participantes.length > 1 && (
                    <button
                      className={styles.removePartBtn}
                      type="button"
                      onClick={() => removeParticipante(index)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" className={styles.addPartBtn} onClick={addParticipante}>
              + Agregar participante
            </button>
          </div>

          <Textarea
            label="Notas"
            value={form.notas}
            onChange={(e) => setField('notas', e.target.value)}
            rows={2}
          />

          <div className={styles.actions}>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Registrar</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
