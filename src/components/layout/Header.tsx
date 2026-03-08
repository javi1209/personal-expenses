import { useEffect, useState } from 'react';
import { Bell, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFormatting } from '../../hooks/useFormatting.ts';
import { useAuthStore } from '../../store/authStore.ts';
import { useAlertasStore } from '../../store/alertasStore.ts';
import { AlertsPanel } from '../alerts/AlertsPanel.tsx';
import styles from './Header.module.css';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { alertas, loadAlertas, initializeSockets } = useAlertasStore();
  const { user } = useAuthStore();
  const { formatDate } = useFormatting();
  const [showAlerts, setShowAlerts] = useState(false);

  const noLeidas = alertas.filter((a) => !a.leida).length;

  useEffect(() => {
    if (user) {
      void loadAlertas();
      initializeSockets();
    }
  }, [user, loadAlertas, initializeSockets]);

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
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={styles.alertBtn}
            onClick={() => setShowAlerts(true)}
            aria-label={`${noLeidas} alertas no leídas`}
          >
            <Bell size={18} />
            {noLeidas > 0 && <span className={styles.alertDot}>{noLeidas > 9 ? '9+' : noLeidas}</span>}
          </motion.button>
        </div>
      </header>
      <AlertsPanel open={showAlerts} onClose={() => setShowAlerts(false)} alertas={alertas} />
    </>
  );
}
