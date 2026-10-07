'use client';

import React from 'react';
import { Save } from 'lucide-react';
import { ActionForm, SubmitButton } from '@/components/forms/ActionForm';
import { CheckboxField, FieldGroup, SelectField, TextAreaField, TextField } from '@/components/forms/Fields';
import { LocationPicker } from '@/components/maps/LocationPicker';
import { ButtonLink } from '@/components/ui/Button';
import { JENJANG_OPTIONS } from '@/lib/domain';
import type { FormState } from '@/lib/forms';

export interface GudepFormValues {
  kwarranId?: string;
  name?: string;
  number?: string | null;
  pangkalan?: string | null;
  jenjang?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  contactName?: string | null;
  contactPhone?: string | null;
  active?: boolean;
}

export const GudepForm: React.FC<{
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  kwarranOptions: { value: string; label: string }[];
  defaults?: GudepFormValues;
  /** false untuk staf gudep: kwarran & status aktif dikunci. */
  canRestructure: boolean;
  cancelHref: string;
  submitLabel: string;
  isNew: boolean;
}> = ({ action, kwarranOptions, defaults = {}, canRestructure, cancelHref, submitLabel, isNew }) => (
  <ActionForm action={action} className="space-y-6">
    <FieldGroup title="Identitas gudep">
      <TextField name="name" label="Nama gudep" defaultValue={defaults.name} hint="Mis. Gudep SMP Negeri 1 Indramayu" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="number"
          label="Nomor gudep"
          defaultValue={defaults.number ?? ''}
          hint="Mis. 11.001-11.002 (putra-putri). Kosongkan bila belum ada."
        />
        {canRestructure ? (
          <SelectField
            name="kwarranId"
            label="Kwarran"
            placeholder="Pilih kwarran…"
            defaultValue={defaults.kwarranId ?? (kwarranOptions.length === 1 ? kwarranOptions[0].value : undefined)}
            options={kwarranOptions}
            required
          />
        ) : (
          <div>
            <p className="text-sm font-medium text-text-primary">Kwarran</p>
            <p className="mt-2 text-text-secondary">{kwarranOptions.find((k) => k.value === defaults.kwarranId)?.label ?? '—'}</p>
            <input type="hidden" name="kwarranId" value={defaults.kwarranId} />
          </div>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="pangkalan" label="Pangkalan (sekolah/lembaga)" defaultValue={defaults.pangkalan ?? ''} />
        <SelectField
          name="jenjang"
          label="Jenjang pangkalan"
          placeholder="Pilih…"
          defaultValue={defaults.jenjang ?? undefined}
          options={JENJANG_OPTIONS.map((j) => ({ value: j, label: j }))}
        />
      </div>
      {canRestructure && !isNew ? (
        <CheckboxField
          name="active"
          label="Gudep aktif"
          description="Gudep nonaktif tidak muncul di pilihan formulir anggota."
          defaultChecked={defaults.active ?? true}
        />
      ) : (
        <input type="hidden" name="active" value="on" />
      )}
    </FieldGroup>

    <FieldGroup title="Lokasi" description="Titik peta membantu Kwarran & Kwarcab memantau sebaran gudep dan merencanakan kegiatan.">
      <TextAreaField name="address" label="Alamat pangkalan" rows={2} defaultValue={defaults.address ?? ''} />
      <LocationPicker defaultLat={defaults.lat ?? null} defaultLng={defaults.lng ?? null} />
    </FieldGroup>

    <FieldGroup title="Kontak gudep" description="Pembina atau penanggung jawab yang dapat dihubungi pengurus.">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="contactName" label="Nama pembina/kontak" defaultValue={defaults.contactName ?? ''} />
        <TextField name="contactPhone" label="Telepon" type="tel" inputMode="tel" defaultValue={defaults.contactPhone ?? ''} />
      </div>
    </FieldGroup>

    <div className="flex flex-wrap gap-3">
      <SubmitButton>
        <Save className="h-4 w-4" aria-hidden="true" />
        {submitLabel}
      </SubmitButton>
      <ButtonLink href={cancelHref} variant="ghost">
        Batal
      </ButtonLink>
    </div>
  </ActionForm>
);
