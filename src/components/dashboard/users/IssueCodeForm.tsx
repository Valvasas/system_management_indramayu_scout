'use client';

import React from 'react';
import { KeyRound } from 'lucide-react';
import { ActionForm, SubmitButton } from '@/components/forms/ActionForm';
import type { FormState } from '@/lib/forms';

/** Tombol "buat kode akses" yang menampilkan kodenya sekali di tempat (bukan di URL/log). */
export const IssueCodeForm: React.FC<{ action: (state: FormState, formData: FormData) => Promise<FormState>; label?: string }> = ({
  action,
  label = 'Buat kode akses',
}) => (
  <ActionForm action={action} className="space-y-3">
    <SubmitButton variant="secondary" pendingLabel="Membuat kode">
      <KeyRound className="h-4 w-4" aria-hidden="true" />
      {label}
    </SubmitButton>
  </ActionForm>
);
