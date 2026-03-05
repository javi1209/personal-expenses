import { useState } from 'react';
import { Bell, Calendar } from 'lucide-react';
import { useAlerts } from '../../hooks/useAlerts.ts';
import { useFormatting } from '../../hooks/useFormatting.ts';
import { AlertsPanel } from '../alerts/AlertsPanel.tsx';
import styles from './Header.module.css';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const alertas = useAlerts();
  const { formatDate } = useFormatting();
  const [showAlerts, setShowAlerts] = useState(false);
  const hayUrgentes = alertas.some((a) => a.urgente);

  const hoy = formatDate(new Date(), {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <>
      <header className={styles.header}>
        <div className={styles.left}>
          <h1 className={styles.pageTitle}>{title}</h1>
          {subtitle && <span className={styles.pageSubtitle}>{subtitle}</span>}
        </div>
        <div className={styles.right}>
          <div className={styles.dateChip}>
            <Calendar size={12} />
            {hoy}
          </div>
          <button
            className={styles.alertBtn}
            onClick={() => setShowAlerts(true)}
            aria-label={`${alertas.length} alertas`}
          >
            <Bell size={18} />
            {hayUrgentes && <span className={styles.alertDot} />}
          </button>
        </div>
      </header>
      <AlertsPanel open={showAlerts} onClose={() => setShowAlerts(false)} alertas={alertas} />
    </>
  );
}
