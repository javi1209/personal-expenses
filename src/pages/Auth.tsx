import { type FormEvent, useMemo, useState } from 'react';
import { Crown, Lock, Mail, UserRound } from 'lucide-react';
import { Button } from '../components/ui/Button.tsx';
import { Card } from '../components/ui/Card.tsx';
import { Input } from '../components/ui/Input.tsx';
import { useAuthStore } from '../store/authStore.ts';
import styles from './Auth.module.css';

type AuthMode = 'login' | 'register';

export function Auth() {
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const loading = useAuthStore((s) => s.loading);
  const [mode, setMode] = useState<AuthMode>('login');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const title = useMemo(
    () => (mode === 'login' ? 'Iniciar Sesion' : 'Crear Cuenta'),
    [mode]
  );

  const subtitle = useMemo(
    () => (
      mode === 'login'
        ? 'Accede a tus datos personales de gastos'
        : 'Registra tu usuario para comenzar'
    ),
    [mode]
  );

  const clearForm = () => {
    setNombre('');
    setEmail('');
    setPassword('');
    setError('');
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    clearForm();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (mode === 'register' && nombre.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.');
      return;
    }

    if (password.trim().length < 8) {
      setError('La password debe tener al menos 8 caracteres.');
      return;
    }

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(nombre, email, password);
      }
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'No se pudo iniciar sesion';
      setError(message);
    }
  };

  return (
    <div className={`${styles.page} parchment-bg`}>
      <div className={styles.hero}>
        <Crown className={styles.heroIcon} />
        <h1 className={styles.heroTitle}>Gastos App</h1>
        <p className={styles.heroSubtitle}>Control financiero seguro y personal</p>
      </div>

      <Card elevated className={styles.card}>
        <div className={styles.modeSwitcher}>
          <button
            className={`${styles.modeButton} ${mode === 'login' ? styles.active : ''}`}
            onClick={() => switchMode('login')}
            type="button"
          >
            Iniciar sesion
          </button>
          <button
            className={`${styles.modeButton} ${mode === 'register' ? styles.active : ''}`}
            onClick={() => switchMode('register')}
            type="button"
          >
            Registrarme
          </button>
        </div>

        <h2 className={styles.title}>{title}</h2>
        <p className={styles.subtitle}>{subtitle}</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          {mode === 'register' && (
            <Input
              required
              label="Nombre"
              placeholder="Tu nombre"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
            />
          )}

          <Input
            required
            label="Email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <Input
            required
            label="Password"
            type="password"
            placeholder="Minimo 8 caracteres"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" disabled={loading} className={styles.submit}>
            {mode === 'login' ? <Lock size={16} /> : <UserRound size={16} />}
            {loading
              ? 'Procesando...'
              : mode === 'login'
                ? 'Entrar'
                : 'Crear Cuenta'}
          </Button>
        </form>

        <p className={styles.note}>
          <Mail size={14} />
          Tu informacion queda aislada por usuario.
        </p>
      </Card>
    </div>
  );
}
