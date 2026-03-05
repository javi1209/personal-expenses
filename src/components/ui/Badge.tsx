import { type ReactNode } from 'react';
import styles from './Badge.module.css';

interface BadgeProps {
  children: ReactNode;
  color?: 'gold' | 'red' | 'green' | 'muted' | 'blue';
  className?: string;
}

export function Badge({ children, color = 'muted', className = '' }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[color]} ${className}`}>
      {children}
    </span>
  );
}
