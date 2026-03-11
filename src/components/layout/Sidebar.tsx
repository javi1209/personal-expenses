import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Wallet, Tag, Target, Users, BarChart3,
  ChevronsLeft, ChevronsRight, Crown, LogOut, Landmark, ChevronDown,
} from 'lucide-react';
import { useAlerts } from '../../hooks/useAlerts.ts';
import { useAuthStore } from '../../store/authStore.ts';
import {
  CURRENCY_OPTIONS,
  LOCALE_OPTIONS,
  THEME_OPTIONS,
  type AppCurrency,
  type AppLocale,
  type AppTheme,
  usePreferencesStore,
} from '../../store/preferencesStore.ts';
import { useLayoutStore } from '../../store/layoutStore.ts';
import { usePWAInstall } from '../../hooks/usePWAInstall.ts';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/gastos', icon: Wallet, label: 'Mis Gastos' },
  { to: '/categorias', icon: Tag, label: 'Categorías' },
  { to: '/presupuestos', icon: Target, label: 'Presupuestos' },
  { to: '/metas', icon: Crown, label: 'Metas de Ahorro' },
  { to: '/compartidos', icon: Users, label: 'Compartidos' },
  { to: '/cuentas', icon: Landmark, label: 'Cuentas' },
  { to: '/reportes', icon: BarChart3, label: 'Reportes' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const mobileSidebarOpen = useLayoutStore((s) => s.mobileSidebarOpen);
  const setMobileSidebarOpen = useLayoutStore((s) => s.setMobileSidebarOpen);
  const location = useLocation();
  const alertas = useAlerts();
  const urgentes = alertas.filter((a) => a.urgente).length;
  const logout = useAuthStore((s) => s.logout);
  const locale = usePreferencesStore((s) => s.locale);
  const currency = usePreferencesStore((s) => s.currency);
  const theme = usePreferencesStore((s) => s.theme);
  const setLocale = usePreferencesStore((s) => s.setLocale);
  const setCurrency = usePreferencesStore((s) => s.setCurrency);
  const setTheme = usePreferencesStore((s) => s.setTheme);
  const { isInstallable, handleInstall } = usePWAInstall();

  return (
    <>
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.overlay}
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${mobileSidebarOpen ? styles.mobileOpen : ''}`}>
        {/* Brand */}
        <NavLink to="/" className={styles.brand}>
          <Crown className={styles.brandIcon} />
          <span className={styles.brandText}>Gastos App</span>
        </NavLink>

        {/* Navigation */}
        <nav className={styles.nav}>
          <div className={styles.navSection}>
            <span className={styles.navSectionLabel}>Navegación</span>
          </div>
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
            const isActive = to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(to);
            return (
              <motion.div key={to} whileHover={{ x: 5 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                <NavLink
                  to={to}
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  <Icon className={styles.navIcon} />
                  <span className={styles.navLabel}>{label}</span>
                  {label === 'Dashboard' && urgentes > 0 && (
                    <span className={styles.alertBadge}>{urgentes}</span>
                  )}
                </NavLink>
              </motion.div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.settingsBox}>
            <button
              type="button"
              className={styles.settingsToggle}
              onClick={() => setRegionOpen((o) => !o)}
              aria-expanded={regionOpen}
            >
              <p className={styles.settingsTitle}>Region</p>
              <ChevronDown
                size={12}
                className={`${styles.settingsChevron} ${regionOpen ? styles.settingsChevronOpen : ''}`}
              />
            </button>
            {regionOpen && (
              <div className={styles.settingsContent}>
                <label className={styles.settingsLabel}>
                  Locale
                  <select
                    className={styles.settingsSelect}
                    value={locale}
                    onChange={(event) => setLocale(event.target.value as AppLocale)}
                    aria-label="Configurar locale"
                  >
                    {LOCALE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.settingsLabel}>
                  Moneda
                  <select
                    className={styles.settingsSelect}
                    value={currency}
                    onChange={(event) => setCurrency(event.target.value as AppCurrency)}
                    aria-label="Configurar moneda"
                  >
                    {CURRENCY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.settingsLabel}>
                  Tema
                  <select
                    className={styles.settingsSelect}
                    value={theme}
                    onChange={(event) => setTheme(event.target.value as AppTheme)}
                    aria-label="Configurar tema"
                  >
                    {THEME_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>
          {isInstallable && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={styles.installBtn}
              onClick={handleInstall}
              type="button"
            >
              <Crown size={15} />
              <span className={styles.installLabel}>Descargar App</span>
            </motion.button>
          )}
          <motion.button
            whileHover={{ backgroundColor: 'var(--got-red-dim)', color: 'var(--got-red-light)' }}
            whileTap={{ scale: 0.98 }}
            className={styles.logoutBtn}
            onClick={logout}
            type="button"
            aria-label="Cerrar sesion"
          >
            <LogOut size={15} />
            <span className={styles.logoutLabel}>Cerrar sesion</span>
          </motion.button>
          <motion.button
            whileHover={{ color: 'var(--got-gold)' }}
            whileTap={{ scale: 0.95 }}
            className={styles.collapseBtn}
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {collapsed
              ? <ChevronsRight size={16} />
              : <ChevronsLeft size={16} />
            }
            <span className={styles.collapseBtnLabel}>
              {collapsed ? '' : 'Colapsar'}
            </span>
          </motion.button>
        </div>
      </aside>
    </>
  );
}
