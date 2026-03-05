import { type ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { Sidebar } from './Sidebar.tsx';
import styles from './Layout.module.css';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className={`${styles.layout} parchment-bg`}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.content}>
          {children}
        </div>
      </main>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--got-surface-2)',
            color: 'var(--got-text)',
            border: '1px solid var(--got-border-gold)',
            fontFamily: 'var(--font-data)',
            fontSize: 'var(--text-sm)',
          },
          success: { iconTheme: { primary: 'var(--got-gold)', secondary: 'var(--got-black)' } },
          error:   { iconTheme: { primary: 'var(--got-red-light)', secondary: 'var(--got-black)' } },
        }}
      />
    </div>
  );
}
