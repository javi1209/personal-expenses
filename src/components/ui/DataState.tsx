import { AlertTriangle, Inbox, LoaderCircle } from 'lucide-react';
import { Button } from './Button.tsx';
import styles from './DataState.module.css';

type DataStateVariant = 'loading' | 'empty' | 'error';

interface DataStateProps {
  variant: DataStateVariant;
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
  pending?: boolean;
  className?: string;
}

const DEFAULT_TITLE: Record<DataStateVariant, string> = {
  loading: 'Cargando datos',
  empty: 'Sin resultados',
  error: 'No se pudo cargar',
};

const ICON_BY_VARIANT = {
  loading: LoaderCircle,
  empty: Inbox,
  error: AlertTriangle,
} as const;

export function DataState({
  variant,
  title,
  message,
  actionLabel,
  onAction,
  pending = false,
  className = '',
}: DataStateProps) {
  const Icon = ICON_BY_VARIANT[variant];

  return (
    <div className={`${styles.root} ${styles[variant]} ${className}`} role={variant === 'error' ? 'alert' : 'status'}>
      <div className={styles.head}>
        <Icon className={`${styles.icon} ${variant === 'loading' ? styles.spinning : ''}`} size={18} />
        <p className={styles.title}>{title ?? DEFAULT_TITLE[variant]}</p>
      </div>
      <p className={styles.message}>{message}</p>
      {onAction && (
        <Button
          className={styles.action}
          type="button"
          size="sm"
          variant={variant === 'error' ? 'secondary' : 'ghost'}
          onClick={() => void onAction()}
          disabled={pending}
        >
          {pending ? 'Procesando...' : actionLabel ?? 'Reintentar'}
        </Button>
      )}
    </div>
  );
}
