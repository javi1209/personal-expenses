import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
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
  const isAuthenticated = Boolean(user && token);
  const userId = user?.id ?? null;

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
  }, [isAuthenticated, userId, loadGastos, loadPresupuestos, loadCompartidos]);

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

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/gastos" element={<Gastos />} />
        <Route path="/categorias" element={<Categorias />} />
        <Route path="/presupuestos" element={<Presupuestos />} />
        <Route path="/compartidos" element={<GastosCompartidos />} />
        <Route path="/cuentas" element={<Cuentas />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/auth" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
