'use client';

import React, { useState } from 'react';
import { Archive, CheckCircle2, KeyRound, RotateCcw, UserPlus } from 'lucide-react';
import { ActionForm, SubmitButton } from '@/components/forms/ActionForm';
import { TextAreaField, TextField } from '@/components/forms/Fields';
import type { FormState } from '@/lib/forms';

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

/** Verifikasi: setujui (opsional isi KTA) atau kembalikan dengan catatan. */
export const VerifyForm: React.FC<{ action: Action; currentKta: string | null }> = ({ action, currentKta }) => {
  const [mode, setMode] = useState<'approve' | 'return'>('approve');
  return (
    <ActionForm action={action}>
      <fieldset>
        <legend className="mb-2 font-medium text-text-primary">Keputusan</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              { v: 'approve', label: 'Setujui', desc: 'Data sesuai dokumen. Anggota menjadi Aktif.' },
              { v: 'return', label: 'Kembalikan', desc: 'Ada yang perlu diperbaiki pengisi data.' },
            ] as const
          ).map((o) => (
            <div
              key={o.v}
              className={`flex gap-3 rounded-lg border p-4 ${mode === o.v ? 'border-action-primary bg-surface-brand-tint' : 'border-border-subtle bg-surface-base'}`}
            >
              <input
                id={`decision-${o.v}`}
                type="radio"
                name="decision"
                value={o.v}
                checked={mode === o.v}
                onChange={() => setMode(o.v)}
                aria-describedby={`decision-${o.v}-desc`}
                className="mt-1 h-4 w-4 accent-action-primary"
              />
              <div>
                <label htmlFor={`decision-${o.v}`} className="block cursor-pointer font-semibold text-text-primary">
                  {o.label}
                </label>
                <p id={`decision-${o.v}-desc`} className="text-sm text-text-secondary">
                  {o.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </fieldset>
      {mode === 'approve' ? (
        <TextField name="kta" label="Nomor KTA" defaultValue={currentKta ?? ''} hint="Opsional. Isi bila kartu sudah terbit." />
      ) : (
        <TextAreaField
          name="reviewNote"
          label="Apa yang perlu diperbaiki?"
          rows={3}
          hint="Catatan ini terlihat oleh pengisi data."
          required
        />
      )}
      <SubmitButton variant={mode === 'approve' ? 'primary' : 'outline'}>
        {mode === 'approve' ? (
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        ) : (
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
        )}
        {mode === 'approve' ? 'Setujui data' : 'Kembalikan untuk diperbaiki'}
      </SubmitButton>
    </ActionForm>
  );
};

export const ArchiveForm: React.FC<{ action: Action }> = ({ action }) => (
  <ActionForm action={action}>
    <TextField name="reason" label="Alasan pengarsipan" hint="Mis. pindah domisili, lulus, mengundurkan diri." required />
    <SubmitButton variant="danger">
      <Archive className="h-4 w-4" aria-hidden="true" />
      Arsipkan anggota
    </SubmitButton>
  </ActionForm>
);

export const PortalAccountForm: React.FC<{ action: Action; reset?: boolean }> = ({ action, reset }) => (
  <ActionForm action={action}>
    <SubmitButton variant="outline">
      {reset ? <KeyRound className="h-4 w-4" aria-hidden="true" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
      {reset ? 'Buat kode reset' : 'Buat akun & kode aktivasi'}
    </SubmitButton>
  </ActionForm>
);
