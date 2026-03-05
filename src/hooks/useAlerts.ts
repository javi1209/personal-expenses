import { useMemo } from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import { useGastosStore } from '../store/gastosStore.ts';
import { usePresupuestosStore } from '../store/presupuestosStore.ts';
import { type Alerta } from '../types/index.ts';
import { useFormatting } from './useFormatting.ts';

export function useAlerts(): Alerta[] {
  const gastos = useGastosStore((s) => s.gastos);
  const presupuestos = usePresupuestosStore((s) => s.presupuestos);
  const { formatCurrency, formatDate } = useFormatting();

  const alertas = useMemo<Alerta[]>(() => {
    const resultado: Alerta[] = [];
    const hoy = new Date();

    // 1. Vencimiento de cuentas (proximos 7 dias).
    gastos.forEach((gasto) => {
      if (!gasto.cuentaVence) return;

      const diasRestantes = differenceInDays(parseISO(gasto.cuentaVence), hoy);
      if (diasRestantes < 0 || diasRestantes > 7) return;

      resultado.push({
        id: `vence-${gasto.id}`,
        tipo: 'vencimiento',
        titulo: diasRestantes === 0
          ? 'Vence hoy'
          : `Vence en ${diasRestantes} dia${diasRestantes === 1 ? '' : 's'}`,
        mensaje: `La cuenta "${gasto.descripcion}" por ${formatCurrency(gasto.monto)} vence el ${formatDate(gasto.cuentaVence)}`,
        fecha: gasto.cuentaVence,
        gastoId: gasto.id,
        leida: false,
        urgente: diasRestantes <= 2,
      });
    });

    // 2. Presupuesto superado o cercano al limite.
    presupuestos.forEach((presupuesto) => {
      const porcentaje = (presupuesto.montoGastado / presupuesto.montoLimite) * 100;

      if (porcentaje >= 100) {
        resultado.push({
          id: `presupuesto-excedido-${presupuesto.id}`,
          tipo: 'presupuesto',
          titulo: 'Presupuesto excedido',
          mensaje: `Superaste el presupuesto de ${presupuesto.categoriaLabel} por ${formatCurrency(presupuesto.montoGastado - presupuesto.montoLimite)}`,
          fecha: new Date().toISOString(),
          presupuestoId: presupuesto.id,
          leida: false,
          urgente: true,
        });
        return;
      }

      if (porcentaje >= presupuesto.alertaUmbral) {
        resultado.push({
          id: `presupuesto-umbral-${presupuesto.id}`,
          tipo: 'presupuesto',
          titulo: 'Presupuesto cerca del limite',
          mensaje: `Has usado el ${Math.round(porcentaje)}% de tu presupuesto de ${presupuesto.categoriaLabel}`,
          fecha: new Date().toISOString(),
          presupuestoId: presupuesto.id,
          leida: false,
          urgente: false,
        });
      }
    });

    return resultado.sort((a, b) => {
      if (a.urgente && !b.urgente) return -1;
      if (!a.urgente && b.urgente) return 1;
      return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
    });
  }, [gastos, presupuestos, formatCurrency, formatDate]);

  return alertas;
}
