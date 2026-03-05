import { useState, type FormEvent, useEffect } from 'react';
import { Pencil, Plus, Trash2, Wallet, Landmark, CreditCard, Coins } from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '../components/layout/Header.tsx';
import { Button } from '../components/ui/Button.tsx';
import { DataState } from '../components/ui/DataState.tsx';
import { ErrorState } from '../components/ui/ErrorState.tsx';
import { Input, Select } from '../components/ui/Input.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { useFormatting } from '../hooks/useFormatting.ts';
import { useCuentasStore } from '../store/cuentasStore.ts';
import { type Cuenta } from '../types/index.ts';
import styles from './Cuentas.module.css';

const TIPO_OPTIONS = [
    { value: 'efectivo', label: 'Efectivo / Billetera' },
    { value: 'banco', label: 'Banco / CBU' },
    { value: 'tarjeta', label: 'Tarjeta de Credito' },
    { value: 'otro', label: 'Otro' },
];

const TIPO_ICONS = {
    efectivo: Coins,
    banco: Landmark,
    tarjeta: CreditCard,
    otro: Wallet,
};

export function Cuentas() {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const { formatCurrency } = useFormatting();
    const {
        cuentas,
        loadCuentas,
        addCuenta,
        updateCuenta,
        deleteCuenta,
        loading,
        error,
    } = useCuentasStore();

    const [form, setForm] = useState({
        nombre: '',
        tipo: 'efectivo' as Cuenta['tipo'],
        saldoInicial: 0,
        color: '#94a3b8',
    });

    useEffect(() => {
        void loadCuentas();
    }, [loadCuentas]);

    const setField = (key: string, value: unknown) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleClose = () => {
        setEditingId(null);
        setForm({
            nombre: '',
            tipo: 'efectivo',
            saldoInicial: 0,
            color: '#94a3b8',
        });
        setModalOpen(false);
    };

    const handleEdit = (cuenta: Cuenta) => {
        setEditingId(cuenta.id);
        setForm({
            nombre: cuenta.nombre,
            tipo: cuenta.tipo,
            saldoInicial: cuenta.saldoInicial,
            color: cuenta.color,
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!form.nombre) {
            toast.error('El nombre es obligatorio');
            return;
        }

        try {
            if (editingId) {
                await updateCuenta(editingId, {
                    nombre: form.nombre,
                    tipo: form.tipo,
                    color: form.color,
                });
                toast.success('Cuenta actualizada');
            } else {
                await addCuenta({
                    ...form,
                    saldoInicial: Number(form.saldoInicial),
                });
                toast.success('Cuenta creada');
            }
            handleClose();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error en la operacion');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Eliminar esta cuenta? Los gastos asociados quedaran sin cuenta.')) return;
        try {
            await deleteCuenta(id);
            toast.success('Cuenta eliminada');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'No se pudo eliminar la cuenta');
        }
    };

    return (
        <>
            <Header title="Mis Bóvedas y Billeteras" subtitle="Gestion de cuentas y saldos reales" />

            <div className={styles.toolbar}>
                <Button onClick={() => setModalOpen(true)}>
                    <Plus size={16} /> Nueva Cuenta
                </Button>
            </div>

            {error && <ErrorState message={error} onRetry={loadCuentas} retrying={loading} />}

            {loading && cuentas.length === 0 ? (
                <DataState variant="loading" title="Cargando cuentas" message="Estamos recuperando tus bovedas." />
            ) : cuentas.length === 0 ? (
                <DataState
                    variant="empty"
                    title="Sin cuentas registradas"
                    message="Crea tu primera cuenta para empezar a trackear saldos reales."
                />
            ) : (
                <div className={styles.grid}>
                    {cuentas.map((cuenta) => {
                        const Icon = TIPO_ICONS[cuenta.tipo] || Wallet;
                        return (
                            <div key={cuenta.id} className={styles.accountCard}>
                                <div className={styles.colorStrip} style={{ background: cuenta.color }} />
                                <div className={styles.cardHeader}>
                                    <div className={styles.accountInfo}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                            <Icon size={18} color={cuenta.color} />
                                            <span className={styles.accountName}>{cuenta.nombre}</span>
                                        </div>
                                        <span className={styles.accountType}>{cuenta.tipo}</span>
                                    </div>
                                    <div className={styles.actions}>
                                        <button
                                            className={styles.actionBtn}
                                            onClick={() => handleEdit(cuenta)}
                                            aria-label="Editar"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                            onClick={() => void handleDelete(cuenta.id)}
                                            aria-label="Eliminar"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.balanceBox}>
                                    <span className={styles.balanceLabel}>Saldo Actual</span>
                                    <span
                                        className={`${styles.balanceValue} ${cuenta.saldoActual < 0 ? styles.negativo : ''
                                            }`}
                                    >
                                        {formatCurrency(cuenta.saldoActual)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal open={modalOpen} onClose={handleClose} title={editingId ? 'Editar Cuenta' : 'Nueva Cuenta'}>
                <form className={styles.form} onSubmit={handleSubmit}>
                    <Input
                        label="Nombre de la cuenta"
                        placeholder="Ej: Billetera, Banco Galicia, etc."
                        required
                        value={form.nombre}
                        onChange={(e) => setField('nombre', e.target.value)}
                    />

                    <div className={styles.row}>
                        <Select
                            label="Tipo"
                            options={TIPO_OPTIONS}
                            value={form.tipo}
                            onChange={(e) => setField('tipo', e.target.value)}
                        />
                        <Input
                            label="Saldo Inicial"
                            type="number"
                            disabled={!!editingId}
                            value={form.saldoInicial}
                            onChange={(e) => setField('saldoInicial', e.target.value)}
                        />
                    </div>

                    <Input
                        label="Color identificador"
                        type="color"
                        value={form.color}
                        onChange={(e) => setField('color', e.target.value)}
                    />

                    <div className={styles.modalActions}>
                        <Button type="button" variant="ghost" onClick={handleClose}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            {editingId ? 'Guardar Cambios' : 'Crear Cuenta'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
