'use client';

import React from 'react';
import { Save } from 'lucide-react';
import { ActionForm, SubmitButton } from '@/components/forms/ActionForm';
import { FieldGroup, TextAreaField, TextField } from '@/components/forms/Fields';
import { LocationPicker } from '@/components/maps/LocationPicker';
import { ButtonLink } from '@/components/ui/Button';
import type { FormState } from '@/lib/forms';

export const KwarranForm: React.FC<{
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaults: {
    code: string | null;
    leaderName: string | null;
    phone: string | null;
    address: string | null;
    lat: number | null;
    lng: number | null;
  };
}> = ({ action, defaults }) => (
  <ActionForm action={action} className="space-y-6">
    <FieldGroup title="Data kwarran">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="code" label="Kode kwarran" defaultValue={defaults.code ?? ''} />
        <TextField name="leaderName" label="Nama ketua" defaultValue={defaults.leaderName ?? ''} />
      </div>
      <TextField name="phone" label="Telepon sekretariat" type="tel" defaultValue={defaults.phone ?? ''} />
      <TextAreaField name="address" label="Alamat sekretariat" rows={2} defaultValue={defaults.address ?? ''} />
    </FieldGroup>
    <FieldGroup title="Lokasi sekretariat">
      <LocationPicker defaultLat={defaults.lat} defaultLng={defaults.lng} />
    </FieldGroup>
    <div className="flex gap-3">
      <SubmitButton>
        <Save className="h-4 w-4" aria-hidden="true" />
        Simpan
      </SubmitButton>
      <ButtonLink href="/dashboard/kwarran" variant="ghost">
        Batal
      </ButtonLink>
    </div>
  </ActionForm>
);
