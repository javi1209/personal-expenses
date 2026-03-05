import { type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import styles from './Input.module.css';

interface FieldWrapperProps {
  label?: string;
  required?: boolean;
  error?: string;
  helper?: string;
  children: React.ReactNode;
}

function FieldWrapper({ label, required, error, helper, children }: FieldWrapperProps) {
  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      {children}
      {error && <span className={styles.error}>{error}</span>}
      {helper && !error && <span className={styles.helper}>{helper}</span>}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export function Input({ label, error, helper, required, ...rest }: InputProps) {
  return (
    <FieldWrapper label={label} required={required} error={error} helper={helper}>
      <input className={styles.input} required={required} {...rest} />
    </FieldWrapper>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helper?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, helper, required, options, ...rest }: SelectProps) {
  return (
    <FieldWrapper label={label} required={required} error={error} helper={helper}>
      <select className={styles.select} required={required} {...rest}>
        <option value="">— Seleccionar —</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </FieldWrapper>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export function Textarea({ label, error, helper, required, ...rest }: TextareaProps) {
  return (
    <FieldWrapper label={label} required={required} error={error} helper={helper}>
      <textarea className={styles.textarea} required={required} {...rest} />
    </FieldWrapper>
  );
}
