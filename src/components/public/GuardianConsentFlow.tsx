'use client';

import React, { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { AlertCircle, CheckCircle2, KeyRound, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { lookupConsentAction, submitConsentAction, type GuardianState } from '@/features/consent/consent-actions';
import { CONSENT_SCOPES, CONSENT_TEXT_VERSION, CONSENT_TEXTS } from '@/features/consent/texts';
import { cn } from '@/lib/utils';

function Submit({ children, pending: pendingLabel }: { children: React.ReactNode; pending: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" isLoading={pending} loadingLabel={pendingLabel} className="w-full sm:w-auto">
      {children}
    </Button>
  );
}

function Alert({ state }: { state: GuardianState }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.message) ref.current?.focus();
  }, [state]);
  if (!state.message) return null;
  const error = state.status === 'error';
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role={error ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2 rounded-lg border px-4 py-3 text-sm font-medium',
        error
          ? 'border-status-danger-border bg-status-danger-surface text-status-danger-text'
          : 'border-status-success-border bg-status-success-surface text-status-success-text',
      )}
    >
      {error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
      <span>{state.message}</span>
    </div>
  );
}

const FieldError = ({ id, message }: { id: string; message?: string }) =>
  message ? (
    <p id={id} className="mt-1.5 text-sm text-status-danger-text">
      {message}
    </p>
  ) : null;

function DecisionForm({ initial }: { initial: GuardianState }) {
  const [state, action] = useFormState(submitConsentAction, initial);
  if (state.stage === 'done') return <Alert state={state} />;
  const err = state.errors ?? {};
  return (
    <form action={action} className="space-y-6" aria-label="Formulir persetujuan wali">
      <Alert state={state.status === 'error' ? state : { status: 'idle' }} />
      <p className="text-text-secondary">
        Persetujuan untuk <strong className="font-semibold text-text-primary">{state.childFirstName}</strong>, anggota{' '}
        <strong className="font-semibold text-text-primary">{state.gudepName}</strong>. Pilih untuk setiap bagian.
      </p>
      <input type="hidden" name="code" value={state.code ?? ''} />
      {CONSENT_SCOPES.map((scope) => {
        const text = CONSENT_TEXTS[scope];
        const errId = `err-${scope}`;
        return (
          <fieldset key={scope} className="rounded-2xl border border-border-subtle p-5" aria-describedby={err[scope] ? errId : undefined}>
            <legend className="px-1 font-display text-lg font-semibold text-text-primary">{text.title}</legend>
            <div className="mt-2 space-y-2 text-sm text-text-secondary">
              {text.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {(
                [
                  ['ya', 'Saya setuju'],
                  ['tidak', 'Saya tidak setuju'],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className="flex min-h-touch cursor-pointer items-center gap-3 rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-text-primary has-[:checked]:border-action-primary has-[:checked]:bg-surface-subtle"
                >
                  <input type="radio" name={scope} value={value} required className="h-4 w-4 accent-action-primary" />
                  {label}
                </label>
              ))}
            </div>
            <FieldError id={errId} message={err[scope]} />
          </fieldset>
        );
      })}
      <div>
        <label htmlFor="f-guardian-name" className="block text-sm font-semibold text-text-primary">
          Nama lengkap orang tua/wali <span className="text-status-danger-text">*</span>
        </label>
        <Input
          id="f-guardian-name"
          name="guardianName"
          required
          autoComplete="name"
          maxLength={120}
          aria-invalid={err.guardianName ? true : undefined}
          aria-describedby={err.guardianName ? 'err-guardianName' : undefined}
          className="mt-1.5"
        />
        <FieldError id="err-guardianName" message={err.guardianName} />
      </div>
      <div>
        <label className="flex min-h-touch cursor-pointer items-start gap-3 text-sm text-text-primary">
          <input
            type="checkbox"
            name="confirm"
            required
            className="mt-1 h-4 w-4 accent-action-primary"
            aria-describedby={err.confirm ? 'err-confirm' : undefined}
          />
          <span>Saya adalah orang tua atau wali sah anak ini dan telah membaca setiap bagian di atas.</span>
        </label>
        <FieldError id="err-confirm" message={err.confirm} />
      </div>
      <p className="text-xs text-text-muted">Versi teks persetujuan: {CONSENT_TEXT_VERSION}. Waktu dan versi ini tercatat bersama pilihan Anda.</p>
      <Submit pending="Menyimpan">
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        Simpan pilihan saya
      </Submit>
    </form>
  );
}

/** Alur wali: (1) masukkan kode dari pembina → (2) baca & pilih per cakupan. */
export function GuardianConsentFlow() {
  const [state, action] = useFormState(lookupConsentAction, { status: 'idle' } as GuardianState);
  if (state.stage === 'decide') return <DecisionForm initial={state} />;
  const error = state.errors?.code;
  return (
    <form action={action} className="space-y-4" aria-label="Masukkan kode persetujuan">
      <Alert state={state} />
      <div>
        <label htmlFor="f-consent-code" className="block text-sm font-semibold text-text-primary">
          Kode dari pembina <span className="text-status-danger-text">*</span>
        </label>
        <Input
          id="f-consent-code"
          name="code"
          required
          autoComplete="one-time-code"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="ABCD-2345"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'err-consent-code' : 'hint-consent-code'}
          className="mt-1.5 max-w-xs font-mono uppercase tracking-[0.2em]"
        />
        <p id="hint-consent-code" className="mt-1.5 text-sm text-text-secondary">
          8 huruf/angka, berlaku 14 hari dan hanya sekali pakai.
        </p>
        <FieldError id="err-consent-code" message={error} />
      </div>
      <Submit pending="Memeriksa">
        <KeyRound className="h-4 w-4" aria-hidden="true" />
        Lanjutkan
      </Submit>
    </form>
  );
}
