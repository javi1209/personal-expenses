import { X, AlertTriangle, Info, Wallet, Check } from 'lucide-react';
import { type Alerta } from '../../services/api.ts';
import { useAlertasStore } from '../../store/alertasStore.ts';
import styles from './AlertsPanel.module.css';

interface AlertsPanelProps {
  open: boolean;
  onClose: () => void;
  alertas: Alerta[];
}

const ICON_MAP = {
  sistema: Info,
  presupuesto: Wallet,
  compartido: AlertTriangle,
} as const;

export function AlertsPanel({ open, onClose, alertas }: AlertsPanelProps) {
  const { marcarLeida, marcarTodasLeidas } = useAlertasStore();

  if (!open) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>⚔ Alertas del Reino</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span className={styles.count}>{alertas.length} alertas</span>
            <button
              className={styles.closeBtn}
              onClick={() => void marcarTodasLeidas()}
              title="Marcar todas como leídas"
              style={{ padding: '2px 6px', fontSize: 10, borderRadius: 4, background: 'var(--got-surface-hover)' }}
            >
              Leídas
            </button>
            <button className={styles.closeBtn} onClick={onClose}><X size={16} /></button>
          </div>
        </div>
        <div className={styles.list}>
          {alertas.length === 0 ? (
            <p className={styles.empty}>El reino está en paz. Sin alertas.</p>
          ) : (
            alertas.map((a) => {
              const Icon = ICON_MAP[a.tipo];
              return (
                <div
                  key={a.id}
                  className={`${styles.alert} ${!a.leida ? styles.urgente : ''} ${styles[a.tipo]}`}
                >
                  <div className={styles.alertIcon}>
                    <Icon
                      size={16}
                      color={!a.leida ? 'var(--got-red-light)' : 'var(--got-gold-dim)'}
                    />
                  </div>
                  <div className={styles.alertBody}>
                    <p className={styles.alertTitle}>{a.titulo}</p>
                    <p className={styles.alertMsg}>{a.mensaje}</p>
                  </div>
                  {!a.leida && (
                    <button
                      onClick={() => void marcarLeida(a.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--got-text-muted)', cursor: 'pointer', marginLeft: 'auto' }}
                      title="Marcar como leída"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
