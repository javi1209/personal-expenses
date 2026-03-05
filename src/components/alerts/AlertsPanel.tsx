import { X, AlertTriangle, Clock, Wallet } from 'lucide-react';
import { type Alerta } from '../../types/index.ts';
import styles from './AlertsPanel.module.css';

interface AlertsPanelProps {
  open: boolean;
  onClose: () => void;
  alertas: Alerta[];
}

const ICON_MAP = {
  vencimiento: Clock,
  presupuesto: Wallet,
  compartido:  AlertTriangle,
} as const;

export function AlertsPanel({ open, onClose, alertas }: AlertsPanelProps) {
  if (!open) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>⚔ Alertas del Reino</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span className={styles.count}>{alertas.length} alertas</span>
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
                  className={`${styles.alert} ${a.urgente ? styles.urgente : ''} ${styles[a.tipo]}`}
                >
                  <div className={styles.alertIcon}>
                    <Icon
                      size={16}
                      color={a.urgente ? 'var(--got-red-light)' : 'var(--got-gold-dim)'}
                    />
                  </div>
                  <div className={styles.alertBody}>
                    <p className={styles.alertTitle}>{a.titulo}</p>
                    <p className={styles.alertMsg}>{a.mensaje}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
