'use client';

import React, { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import type { MfaCodesState } from '@/features/auth/mfa-actions';
import { cn } from '@/lib/utils';

type CodesAction = (state: MfaCodesState, formData: FormData) => Promise<MfaCodesState>;

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" isLoading={pending} loadingLabel="Memeriksa">
      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
      {children}
    </Button>
  );
}

/**
 * Formulir kode TOTP yang, bila berhasil, menampilkan kode pemulihan SEKALI di tempat.
 * Kode tidak pernah lewat URL, log, atau penyimpanan peramban.
 */
export function MfaCodeForm({ action, submitLabel, inputLabel }: { action: CodesAction; submitLabel: string; inputLabel: string }) {
  const [state, formAction] = useFormState(action, { status: 'idle' });
  const alertRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.status !== 'idle') alertRef.current?.focus();
  }, [state]);
  const error = state.errors?.code;

  if (state.status === 'success' && state.codes) {
    return (
      <div
        ref={alertRef}
        tabIndex={-1}
        role="status"
        className="space-y-4 rounded-xl border border-status-success-border bg-status-success-surface p-5"
      >
        <p className="flex items-start gap-2 text-sm font-semibold text-status-success-text">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {state.message}
        </p>
        <ol
          aria-label="Kode pemulihan"
          className="grid grid-cols-2 gap-2 font-mono text-base tracking-wider text-text-primary sm:grid-cols-5"
        >
          {state.codes.map((c) => (
            <li key={c} className="rounded-lg border border-border-subtle bg-surface-base px-3 py-2 text-center">
              {c}
            </li>
          ))}
        </ol>
        <p className="text-sm text-text-secondary">
          Tulis atau cetak lalu simpan di tempat aman, terpisah dari ponsel. Setiap kode hanya berlaku sekali. Halaman ini tidak akan
          menampilkannya lagi.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.status === 'error' && state.message && (
        <div
          ref={alertRef}
          tabIndex={-1}
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-status-danger-border bg-status-danger-surface px-4 py-3 text-sm font-medium text-status-danger-text"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{state.message}</span>
        </div>
      )}
      <div>
        <label htmlFor="f-mfa-code" className="block text-sm font-semibold text-text-primary">
          {inputLabel} <span className="text-status-danger-text">*</span>
        </label>
        <Input
          id="f-mfa-code"
          name="code"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          placeholder="123456"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'f-mfa-code-error' : undefined}
          className={cn('mt-1.5 max-w-xs font-mono tracking-[0.3em]')}
        />
        {error && (
          <p id="f-mfa-code-error" className="mt-1.5 text-sm text-status-danger-text">
            {error}
          </p>
        )}
      </div>
      <Submit>{submitLabel}</Submit>
    </form>
  );
}
