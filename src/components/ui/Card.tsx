import { type ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: ReactNode;
  title?: string;
  action?: ReactNode;
  elevated?: boolean;
  noPad?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({ children, title, action, elevated, noPad, className = '', style }: CardProps) {
  return (
    <div
      className={`${styles.card} ${elevated ? styles.elevated : ''} ${noPad ? styles.noPad : ''} ${className}`}
      style={style}
    >
      {(title ?? action) && (
        <div className={styles.header}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
