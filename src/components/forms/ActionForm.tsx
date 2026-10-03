'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button, type ButtonVariant } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { FormState } from '@/lib/forms';

const FormStateContext = createContext<FormState>({ status: 'idle' });

/** Galat kolom tertentu dari hasil Server Action terakhir. */
export const useFieldError = (name: string) => useContext(FormStateContext).errors?.[name];

export interface ActionFormProps {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  children: React.ReactNode;
  className?: string;
  /** Kosongkan formulir setelah berhasil (mis. formulir tambah cepat). */
  resetOnSuccess?: boolean;
  'aria-label'?: string;
}

/**
 * Formulir yang menjalankan Server Action dan menampilkan hasilnya:
 * ringkasan di atas (diumumkan pembaca layar) + galat di tiap kolom.
 * Validasi sebenarnya SELALU di server; ini hanya penyaji.
 */
export const ActionForm: React.FC<ActionFormProps> = ({ action, children, className, resetOnSuccess, ...rest }) => {
  const [state, formAction] = useFormState(action, { status: 'idle' });
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status === 'idle') return;
    if (state.status === 'success' && resetOnSuccess) formRef.current?.reset();
    // Bawa fokus ke ringkasan supaya pengguna (dan pembaca layar) langsung tahu hasilnya.
    alertRef.current?.focus();
  }, [state, resetOnSuccess]);

  return (
    <form ref={formRef} action={formAction} className={cn('space-y-5', className)} {...rest}>
      {state.message && (
        <div
          ref={alertRef}
          tabIndex={-1}
          role={state.status === 'error' ? 'alert' : 'status'}
          className={cn(
            'flex items-start gap-2 rounded-lg border px-4 py-3 text-sm font-medium',
            state.status === 'error'
              ? 'border-status-danger-border bg-status-danger-surface text-status-danger-text'
              : 'border-status-success-border bg-status-success-surface text-status-success-text',
          )}
        >
          {state.status === 'error' ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span className="whitespace-pre-line">{state.message}</span>
        </div>
      )}
      <FormStateContext.Provider value={state}>{children}</FormStateContext.Provider>
    </form>
  );
};

export const SubmitButton: React.FC<{
  children: React.ReactNode;
  variant?: ButtonVariant;
  className?: string;
  pendingLabel?: string;
  name?: string;
  value?: string;
}> = ({ children, variant = 'primary', className, pendingLabel = 'Menyimpan', name, value }) => {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} isLoading={pending} loadingLabel={pendingLabel} className={className} name={name} value={value}>
      {children}
    </Button>
  );
};
