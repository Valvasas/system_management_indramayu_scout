'use client';

import React from 'react';
import { Save } from 'lucide-react';
import { ActionForm, SubmitButton } from '@/components/forms/ActionForm';
import { FieldGroup, SelectField, TextAreaField, TextField, type Option } from '@/components/forms/Fields';
import {
  KIND_LONG_LABELS,
  REQUIREMENT_CODE_MAX,
  REQUIREMENT_DESCRIPTION_MAX,
  REQUIREMENT_LEVEL_MAX,
  REQUIREMENT_TITLE_MAX,
} from '@/features/competency/labels';
import type { FormState } from '@/lib/forms';

export interface RequirementDefaults {
  kind?: string;
  golongan?: string;
  level?: string;
  code?: string;
  title?: string;
  description?: string | null;
  sortOrder?: number;
}

const KIND_OPTIONS: Option[] = (['SKU', 'SKK'] as const).map((k) => ({ value: k, label: KIND_LONG_LABELS[k] }));

/**
 * Formulir syarat SKU/SKK (data referensi). Validasi sebenarnya di server (Zod). Tingkatan yang
 * sudah ada ditawarkan lewat `datalist`, tetapi isian bebas tetap diterima.
 */
export const RequirementForm: React.FC<{
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  golonganOptions: Option[];
  levels: string[];
  defaults?: RequirementDefaults;
  golonganLocked?: boolean;
}> = ({ action, golonganOptions, levels, defaults = {}, golonganLocked }) => (
  <ActionForm action={action} aria-label="Formulir syarat SKU/SKK">
    <FieldGroup
      title="Teks syarat"
      description="Ketik apa adanya dari dokumen resmi Kwarnas. Jangan meringkas atau memparafrasekan — termasuk Tri Satya dan Dasa Darma."
    >
      <TextAreaField
        name="title"
        label="Judul / bunyi syarat"
        defaultValue={defaults.title}
        rows={3}
        maxLength={REQUIREMENT_TITLE_MAX}
        required
      />
      <TextAreaField
        name="description"
        label="Keterangan (opsional)"
        hint="Mis. cara pembuktian atau rujukan halaman buku SKU. Terlihat oleh pembina dan peserta."
        defaultValue={defaults.description ?? ''}
        rows={3}
        maxLength={REQUIREMENT_DESCRIPTION_MAX}
      />
    </FieldGroup>

    <FieldGroup title="Penggolongan">
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField name="kind" label="Jenis" options={KIND_OPTIONS} defaultValue={defaults.kind ?? 'SKU'} required />
        <SelectField
          name="golongan"
          label="Golongan"
          options={golonganOptions}
          defaultValue={defaults.golongan}
          placeholder="Pilih golongan"
          hint={golonganLocked ? 'Sudah pernah diverifikasi: golongan tidak dapat diubah lagi.' : undefined}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="level"
          label="Tingkatan / nama SKK"
          defaultValue={defaults.level}
          list="sku-levels"
          maxLength={REQUIREMENT_LEVEL_MAX}
          hint="Mis. Ramu, Rakit, Terap untuk SKU Penggalang, atau nama SKK."
          required
        />
        <TextField
          name="code"
          label="Kode"
          defaultValue={defaults.code}
          maxLength={REQUIREMENT_CODE_MAX}
          autoCapitalize="characters"
          spellCheck={false}
          hint="Unik. Huruf, angka, titik, tanda hubung; disimpan huruf besar."
          required
        />
      </div>
      <datalist id="sku-levels">
        {levels.map((l) => (
          <option key={l} value={l} />
        ))}
      </datalist>
      <TextField
        name="sortOrder"
        label="Urutan"
        type="number"
        inputMode="numeric"
        min={0}
        max={9999}
        defaultValue={defaults.sortOrder ?? 0}
        hint="Angka kecil tampil lebih dulu. Urutan tingkatan mengikuti angka terkecil di dalamnya (mis. Ramu 1–99, Rakit 101–199)."
        required
        className="sm:max-w-xs"
      />
    </FieldGroup>

    <SubmitButton>
      <Save className="h-4 w-4" aria-hidden="true" />
      Simpan syarat
    </SubmitButton>
  </ActionForm>
);
