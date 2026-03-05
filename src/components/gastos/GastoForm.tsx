import { useState, type FormEvent } from 'react';
import { Input, Select, Textarea } from '../ui/Input.tsx';
import { Button } from '../ui/Button.tsx';
import { useFormatting } from '../../hooks/useFormatting.ts';
import { useGastosStore } from '../../store/gastosStore.ts';
import { CATEGORIAS } from '../../data/mockData.ts';
import { useCuentasStore } from '../../store/cuentasStore.ts';
import { type Gasto } from '../../types/index.ts';
import toast from 'react-hot-toast';
import styles from './GastoForm.module.css';

interface GastoFormProps {
  onClose: () => void;
  initial?: Gasto;
}

const CAT_OPTIONS = CATEGORIAS.map((c) => ({ value: c.tipo, label: c.nombre }));

export function GastoForm({ onClose, initial }: GastoFormProps) {
  const addGasto = useGastosStore((s) => s.addGasto);
  const updateGasto = useGastosStore((s) => s.updateGasto);
  const cuentas = useCuentasStore((s) => s.cuentas);
  const { currency } = useFormatting();
  const isEdit = Boolean(initial);

  const [form, setForm] = useState({
    descripcion: initial?.descripcion ?? '',
    monto: initial?.monto ?? 0,
    fecha: initial?.fecha ?? new Date().toISOString().split('T')[0],
    categoria: initial?.categoria ?? '',
    notas: initial?.notas ?? '',
    esRecurrente: initial?.esRecurrente ?? false,
    cuentaVence: initial?.cuentaVence ?? '',
    esCompartido: initial?.esCompartido ?? false,
    cuentaId: initial?.cuentaId ?? '',
  });

  const set = (key: string, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.descripcion || !form.monto || !form.categoria) {
      toast.error('Completa los campos requeridos');
      return;
    }
    const catLabel = CATEGORIAS.find((c) => c.tipo === form.categoria)?.nombre ?? form.categoria;
    const data = { ...form, categoriaLabel: catLabel, monto: Number(form.monto), categoria: form.categoria as Gasto['categoria'] };

    try {
      if (isEdit && initial) {
        await updateGasto(initial.id, data);
        toast.success('Gasto actualizado');
      } else {
        await addGasto(data);
        toast.success('Gasto registrado en los libros del reino');
      }
      onClose();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'No se pudo guardar el gasto';
      toast.error(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.row}>
        <Input
          label="Descripción" required
          value={form.descripcion}
          onChange={(e) => set('descripcion', e.target.value)}
          placeholder="Ej: Supermercado, Renta…"
        />
        <Input
          label={`Monto (${currency})`} required type="number" min={0} step={0.01}
          value={form.monto || ''}
          onChange={(e) => set('monto', e.target.value)}
          placeholder="0.00"
        />
      </div>

      <div className={styles.row}>
        <Input
          label="Fecha" required type="date"
          value={form.fecha}
          onChange={(e) => set('fecha', e.target.value)}
        />
        <Select
          label="Categoría" required
          value={form.categoria}
          options={CAT_OPTIONS}
          onChange={(e) => set('categoria', e.target.value)}
        />
      </div>

      <div className={styles.row}>
        <Select
          label="Pagar con"
          value={form.cuentaId}
          options={[
            { value: '', label: 'Seleccionar cuenta (opcional)' },
            ...cuentas.map((c) => ({ value: c.id, label: c.nombre })),
          ]}
          onChange={(e) => set('cuentaId', e.target.value)}
          helper="El balance de la cuenta se ajustara automaticamente"
        />
      </div>

      <div className={styles.checkRow}>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={form.esRecurrente}
            onChange={(e) => set('esRecurrente', e.target.checked)}
          />
          <span>Gasto recurrente</span>
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={form.esCompartido}
            onChange={(e) => set('esCompartido', e.target.checked)}
          />
          <span>Es compartido</span>
        </label>
      </div>

      {form.esRecurrente && (
        <Input
          label="Fecha de vencimiento" type="date"
          value={form.cuentaVence}
          onChange={(e) => set('cuentaVence', e.target.value)}
          helper="Te avisaremos 7 días antes"
        />
      )}

      <Textarea
        label="Notas"
        value={form.notas}
        onChange={(e) => set('notas', e.target.value)}
        placeholder="Notas adicionales…"
        rows={3}
      />

      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button type="submit" variant="primary">
          {isEdit ? 'Guardar cambios' : 'Registrar Gasto'}
        </Button>
      </div>
    </form>
  );
}
