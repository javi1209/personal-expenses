import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from './components/layout/Layout.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { Auth } from './pages/Auth.tsx';
import { Gastos } from './pages/Gastos.tsx';
import { Categorias } from './pages/Categorias.tsx';
import { Presupuestos } from './pages/Presupuestos.tsx';
import { GastosCompartidos } from './pages/GastosCompartidos.tsx';
import { Reportes } from './pages/Reportes.tsx';
import { useAuthStore } from './store/authStore.ts';
import { useGastosStore } from './store/gastosStore.ts';
import { usePresupuestosStore } from './store/presupuestosStore.ts';
import { useCompartidosStore } from './store/compartidosStore.ts';
import { useCuentasStore } from './store/cuentasStore.ts';
import { Cuentas } from './pages/Cuentas.tsx';
import { usePreferencesStore } from './store/preferencesStore.ts';

export default function App() {
  const bootstrapAuth = useAuthStore((s) => s.bootstrapAuth);
  const logout = useAuthStore((s) => s.logout);
  const checkingAuth = useAuthStore((s) => s.checkingAuth);
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const loadGastos = useGastosStore((s) => s.loadGastos);
  const loadPresupuestos = usePresupuestosStore((s) => s.loadPresupuestos);
  const loadCompartidos = useCompartidosStore((s) => s.loadGastos);
  const loadCuentas = useCuentasStore((s) => s.loadCuentas);
  const syncPreferences = usePreferencesStore((s) => s.syncWithBackend);
  const isAuthenticated = Boolean(user && token);
  const userId = user?.id ?? null;
  const location = useLocation();

  useEffect(() => {
    void bootstrapAuth();
  }, [bootstrapAuth]);

  useEffect(() => {
    const onUnauthorized = () => logout();
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, [logout]);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    void Promise.allSettled([
      loadGastos(),
      loadPresupuestos(),
      loadCompartidos(),
      loadCuentas(),
    ]);
  }, [isAuthenticated, userId, loadGastos, loadPresupuestos, loadCompartidos, loadCuentas]);

  useEffect(() => {
    if (!token) return;
    void syncPreferences(token);
  }, [token, syncPreferences]);

  if (checkingAuth) {
    return (
      <div
        className="parchment-bg"
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'var(--font-data)',
          color: 'var(--got-text-muted)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontSize: 'var(--text-xs)',
        }}
      >
        Validando sesion...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<Auth />} />
      </Routes>
    );
  }

  const PageTransition = ({ children }: { children: React.ReactNode }) => (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </motion.div>
  );

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Dashboard /></PageTransition>} />
          <Route path="/gastos" element={<PageTransition><Gastos /></PageTransition>} />
          <Route path="/categorias" element={<PageTransition><Categorias /></PageTransition>} />
          <Route path="/presupuestos" element={<PageTransition><Presupuestos /></PageTransition>} />
          <Route path="/compartidos" element={<PageTransition><GastosCompartidos /></PageTransition>} />
          <Route path="/cuentas" element={<PageTransition><Cuentas /></PageTransition>} />
          <Route path="/reportes" element={<PageTransition><Reportes /></PageTransition>} />
          <Route path="/auth" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
}
