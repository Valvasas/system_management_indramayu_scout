'use client';

import React from 'react';
import { Send } from 'lucide-react';
import { ActionForm, SubmitButton } from '@/components/forms/ActionForm';
import { SelectField, TextAreaField, TextField } from '@/components/forms/Fields';
import type { FormState } from '@/lib/forms';

export const AnnouncementForm: React.FC<{
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  audienceOptions: { value: string; label: string }[];
  /** null = gudep dikunci (staf gudep). */
  gudepOptions: { value: string; label: string }[] | null;
  allowWholeKwarcab: boolean;
}> = ({ action, audienceOptions, gudepOptions, allowWholeKwarcab }) => (
  <ActionForm action={action} resetOnSuccess>
    <TextField name="title" label="Judul" required />
    <TextAreaField
      name="body"
      label="Isi pengumuman"
      rows={5}
      hint="Tulis singkat dan jelas: apa, kapan, di mana, siapa yang perlu bertindak."
      required
    />
    <div className="grid gap-4 sm:grid-cols-2">
      <SelectField name="audience" label="Ditujukan kepada" defaultValue="ALL" options={audienceOptions} required />
      {gudepOptions && (
        <SelectField
          name="gudepId"
          label="Gudep tujuan"
          placeholder={allowWholeKwarcab ? 'Seluruh Kwarcab Indramayu' : 'Pilih gudep…'}
          options={gudepOptions}
          required={!allowWholeKwarcab}
        />
      )}
    </div>
    <SubmitButton>
      <Send className="h-4 w-4" aria-hidden="true" />
      Terbitkan pengumuman
    </SubmitButton>
  </ActionForm>
);
