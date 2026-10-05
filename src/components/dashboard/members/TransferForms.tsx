'use client';

import React, { useState } from 'react';
import { ArrowLeftRight, CheckCircle2, XCircle } from 'lucide-react';
import { ActionForm, SubmitButton } from '@/components/forms/ActionForm';
import { SelectField, TextAreaField } from '@/components/forms/Fields';
import type { FormState } from '@/lib/forms';
import { cn } from '@/lib/utils';

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

/** Ajukan mutasi: pilih gudep tujuan + alasan. Keputusan ada di pengurus wilayah tujuan. */
export const TransferRequestForm: React.FC<{ action: Action; options: { value: string; label: string }[] }> = ({ action, options }) => (
  <ActionForm action={action} aria-label="Ajukan mutasi gudep">
    <SelectField name="toGudepId" label="Gudep tujuan" placeholder="Pilih gudep…" options={options} required />
    <TextAreaField name="reason" label="Alasan" rows={3} maxLength={500} hint="Mis. pindah sekolah, pindah domisili." required />
    <SubmitButton variant="secondary">
      <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
      Ajukan mutasi
    </SubmitButton>
  </ActionForm>
);

/** Setujui / tolak. Penolakan wajib beralasan supaya pengaju tahu langkah berikutnya. */
export const TransferDecisionForm: React.FC<{ action: Action; id: string }> = ({ action, id }) => {
  const [decision, setDecision] = useState<'approve' | 'reject'>('approve');
  return (
    <ActionForm action={action} className="space-y-3" aria-label="Keputusan mutasi">
      <fieldset>
        <legend className="sr-only">Keputusan</legend>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { v: 'approve', label: 'Setujui', icon: CheckCircle2 },
              { v: 'reject', label: 'Tolak', icon: XCircle },
            ] as const
          ).map(({ v, label, icon: Icon }) => (
            <label
              key={v}
              htmlFor={`${id}-${v}`}
              className={cn(
                'flex min-h-touch cursor-pointer items-center justify-center gap-2 rounded-pill border px-3 text-sm font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus-ring',
                decision === v ? 'border-action-primary bg-surface-meadow text-action-secondary-text' : 'border-border-subtle text-text-secondary hover:bg-surface-subtle',
              )}
            >
              <input id={`${id}-${v}`} type="radio" name="decision" value={v} checked={decision === v} onChange={() => setDecision(v)} className="sr-only" />
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <TextAreaField
        name="note"
        label={decision === 'reject' ? 'Alasan penolakan' : 'Catatan (opsional)'}
        rows={2}
        maxLength={500}
        required={decision === 'reject'}
      />
      <SubmitButton variant={decision === 'approve' ? 'primary' : 'outline'} className="w-full">
        {decision === 'approve' ? 'Setujui mutasi' : 'Tolak mutasi'}
      </SubmitButton>
    </ActionForm>
  );
};
