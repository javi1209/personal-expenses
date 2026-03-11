import { useId, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import styles from './Input.module.css';

interface FieldWrapperProps {
  id?: string;
  label?: string;
  required?: boolean;
  error?: string;
  helper?: string;
  children: React.ReactNode;
}

function FieldWrapper({ id, label, required, error, helper, children }: FieldWrapperProps) {
  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={id}>
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

export function Input({ label, error, helper, required, id: providedId, ...rest }: InputProps) {
  const generatedId = useId();
  const id = providedId || generatedId;

  return (
    <FieldWrapper id={id} label={label} required={required} error={error} helper={helper}>
      <input id={id} className={styles.input} required={required} {...rest} />
    </FieldWrapper>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helper?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, helper, required, options, id: providedId, ...rest }: SelectProps) {
  const generatedId = useId();
  const id = providedId || generatedId;

  return (
    <FieldWrapper id={id} label={label} required={required} error={error} helper={helper}>
      <select id={id} className={styles.select} required={required} {...rest}>
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

export function Textarea({ label, error, helper, required, id: providedId, ...rest }: TextareaProps) {
  const generatedId = useId();
  const id = providedId || generatedId;

  return (
    <FieldWrapper id={id} label={label} required={required} error={error} helper={helper}>
      <textarea id={id} className={styles.textarea} required={required} {...rest} />
    </FieldWrapper>
  );
}
