'use client';

import React, { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { AlertCircle, CheckCircle2, MessageSquareText, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Textarea, fieldAria } from '@/components/ui/Field';
import { VERIFICATION_NOTE_MAX } from '@/features/competency/labels';
import type { FormState } from '@/lib/forms';
import { cn } from '@/lib/utils';

const Submit: React.FC<{ verified: boolean; code: string }> = ({ verified, code }) => {
  const { pending } = useFormStatus();
  return verified ? (
    <Button
      type="submit"
      name="intent"
      value="revoke"
      variant="ghost"
      size="sm"
      isLoading={pending}
      loadingLabel="Membatalkan"
      aria-label={`Batalkan verifikasi ${code}`}
    >
      <Undo2 className="h-4 w-4" aria-hidden="true" />
      Batalkan verifikasi
    </Button>
  ) : (
    <Button
      type="submit"
      name="intent"
      value="verify"
      variant="outline"
      size="sm"
      isLoading={pending}
      loadingLabel="Menyimpan"
      aria-label={`Tandai terverifikasi ${code}`}
    >
      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      Tandai terverifikasi
    </Button>
  );
};

/**
 * Tandai / batalkan verifikasi satu syarat SKU/SKK. Formulir Server Action biasa (berfungsi tanpa
 * JavaScript); izin, cakupan, dan Zod ditegakkan di server. Pembatalan meminta konfirmasi dan
 * catatan alasan bersifat opsional. Id kolom unik per syarat (banyak formulir di satu halaman).
 */
export const VerificationControl: React.FC<{
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  requirementId: string;
  code: string;
  verified: boolean;
}> = ({ action, requirementId, code, verified }) => {
  const [state, formAction] = useFormState(action, { status: 'idle' } as FormState);
  const formRef = useRef<HTMLFormElement>(null);
  // Setelah berhasil, baris berganti mode (tandai ↔ batalkan): kosongkan catatan agar tidak terbawa.
  useEffect(() => {
    if (state.status === 'success') formRef.current?.reset();
  }, [state]);
  const noteId = `sku-note-${requirementId}`;
  const noteError = state.errors?.note;
  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-2"
      onSubmit={(e) => {
        if (verified && !window.confirm(`Batalkan verifikasi syarat ${code}? Kemajuan anggota akan berkurang.`)) e.preventDefault();
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Submit verified={verified} code={code} />
        <details className="group" open={Boolean(noteError)}>
          <summary className="inline-flex min-h-touch cursor-pointer list-none items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-text-secondary hover:text-text-primary [&::-webkit-details-marker]:hidden">
            <MessageSquareText className="h-4 w-4" aria-hidden="true" />
            {verified ? 'Alasan (opsional)' : 'Catatan (opsional)'}
          </summary>
          <Field
            id={noteId}
            label={verified ? `Alasan pembatalan ${code}` : `Catatan verifikasi ${code}`}
            hint={`Maksimal ${VERIFICATION_NOTE_MAX} karakter, tanpa data pribadi. Hanya terlihat pengurus, tidak terlihat peserta.`}
            error={noteError}
            className="pt-1"
          >
            <Textarea id={noteId} name="note" rows={2} maxLength={VERIFICATION_NOTE_MAX} {...fieldAria(noteId, noteError, 'hint')} />
          </Field>
        </details>
      </div>
      {state.message && (
        <p
          role={state.status === 'error' ? 'alert' : 'status'}
          className={cn(
            'flex items-start gap-1.5 text-sm font-medium',
            state.status === 'error' ? 'text-status-danger-text' : 'text-status-success-text',
          )}
        >
          {state.status === 'error' ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          {state.message}
        </p>
      )}
    </form>
  );
};
