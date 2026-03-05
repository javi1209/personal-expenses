import { DataState } from './DataState.tsx';

interface ErrorStateProps {
  message: string;
  onRetry: () => void | Promise<void>;
  retrying?: boolean;
  className?: string;
}

export function ErrorState({
  message,
  onRetry,
  retrying = false,
  className = '',
}: ErrorStateProps) {
  return (
    <DataState
      variant="error"
      className={className}
      title="No se pudo cargar esta seccion"
      message={message}
      onAction={onRetry}
      actionLabel="Reintentar"
      pending={retrying}
    />
  );
}
