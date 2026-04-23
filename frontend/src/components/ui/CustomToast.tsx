'use client';

import React from 'react';
import { Toaster, toast, type Toast } from 'react-hot-toast';
import styles from './CustomToast.module.css';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

type NotifyFn = {
  (message: string, variant?: ToastVariant): void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
};

interface CustomToastBodyProps {
  t: Toast;
  message: string;
  variant: ToastVariant;
}

const ICONS: Record<ToastVariant, React.ReactNode> = {
  success: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  warning: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

function CustomToastBody({ t, message, variant }: CustomToastBodyProps) {
  return (
    <div
      className={`${styles.toast} ${styles[variant]} ${
        t.visible ? styles.enter : styles.exit
      }`}
    >
      <div className={styles.iconWrap}>{ICONS[variant]}</div>

      <span className={styles.message}>{message}</span>

      <button
        type="button"
        className={styles.closeBtn}
        onClick={() => toast.dismiss(t.id)}
        aria-label="Dismiss"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div className={styles.progressBar} />
    </div>
  );
}

export const notify: NotifyFn = ((message: string, variant: ToastVariant = 'info') => {
  toast.custom(
    (t) => <CustomToastBody t={t} message={message} variant={variant} />,
    {
      duration: 3500,
      position: 'top-center',
    },
  );
}) as NotifyFn;

notify.success = (message: string) => notify(message, 'success');
notify.error = (message: string) => notify(message, 'error');
notify.warning = (message: string) => notify(message, 'warning');
notify.info = (message: string) => notify(message, 'info');

export function StreamVaultToastContainer() {
  return (
    <Toaster
      position="top-center"
      gutter={10}
      toastOptions={{
        duration: 3500,
      }}
      containerStyle={{
        top: 20,
      }}
    />
  );
}