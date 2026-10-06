import React, { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const control =
  'w-full min-h-touch rounded-lg border bg-surface-base px-3.5 py-2.5 text-base text-text-primary ' +
  'placeholder:text-text-muted border-border-strong ' +
  'aria-[invalid=true]:border-status-danger-text aria-[invalid=true]:bg-status-danger-surface ' +
  'disabled:bg-surface-subtle disabled:text-text-muted';

export interface FieldProps {
  id: string;
  label: string;
  /** Pesan galat dari server. Mengaktifkan aria-invalid + aria-describedby. */
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Pembungkus label + kontrol + galat. Label selalu wajib — tidak ada
 * kontrol tanpa label yang terlihat (placeholder bukan pengganti label).
 */
export const Field: React.FC<FieldProps> = ({ id, label, error, hint, required, className, children }) => (
  <div className={cn('space-y-1', className)}>
    <label htmlFor={id} className="block text-sm font-medium text-text-primary">
      {label}
      {required && (
        <>
          <span aria-hidden="true" className="text-status-danger-text">
            {' '}
            *
          </span>
          <span className="sr-only"> (wajib diisi)</span>
        </>
      )}
    </label>
    {hint && (
      <p id={`${id}-hint`} className="text-sm text-text-secondary">
        {hint}
      </p>
    )}
    {children}
    {error && (
      <p id={`${id}-error`} className="flex items-start gap-1.5 text-sm font-medium text-status-danger-text">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        {error}
      </p>
    )}
  </div>
);

/** Atribut ARIA yang menghubungkan kontrol dengan hint & pesan galatnya. */
export function fieldAria(id: string, error?: string, hint?: string) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ');
  return {
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy || undefined,
  } as const;
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(control, className)} {...props} />
));
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(control, 'resize-y', className)} {...props} />
));
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn(control, 'pr-8', className)} {...props} />
));
Select.displayName = 'Select';
