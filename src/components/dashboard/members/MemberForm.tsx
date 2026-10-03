'use client';

import React, { useMemo, useState } from 'react';
import { Info, Save } from 'lucide-react';
import { ActionForm, SubmitButton } from '@/components/forms/ActionForm';
import { CheckboxField, FieldGroup, SelectField, TextAreaField, TextField } from '@/components/forms/Fields';
import { ButtonLink } from '@/components/ui/Button';
import type { FormState } from '@/lib/forms';
import { GOLONGAN_OPTIONS, ageOn, golonganLabel, suggestedGolongan } from '@/lib/domain';

export interface MemberFormValues {
  fullName?: string;
  gender?: string;
  birthDate?: string;
  golongan?: string;
  gudepId?: string;
  kta?: string | null;
  phone?: string | null;
  address?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  guardianConsentAt?: string | null;
  joinedAt?: string | null;
  notes?: string | null;
}

export const MemberForm: React.FC<{
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  gudepOptions: { value: string; label: string }[];
  defaults?: MemberFormValues;
  cancelHref: string;
  submitLabel: string;
  /** Pengisi tanpa hak verifikasi: beri tahu bahwa data akan diverifikasi kwarran. */
  needsVerification: boolean;
  /** Tampilkan kolom kontak & alamat (data sensitif). */
  showSensitive: boolean;
}> = ({ action, gudepOptions, defaults = {}, cancelHref, submitLabel, needsVerification, showSensitive }) => {
  const [birthDate, setBirthDate] = useState(defaults.birthDate ?? '');
  const age = useMemo(() => (/^\d{4}-\d{2}-\d{2}$/.test(birthDate) ? ageOn(birthDate) : null), [birthDate]);
  const suggestion = birthDate ? suggestedGolongan(birthDate) : null;
  const minor = age !== null && age < 18;

  return (
    <ActionForm action={action} className="space-y-6">
      {needsVerification && (
        <p className="flex items-start gap-2 rounded-lg border border-status-info-border bg-status-info-surface px-4 py-3 text-sm text-status-info-text">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Data yang Anda simpan akan diperiksa staf Kwarran sebelum berstatus Aktif.
        </p>
      )}

      <FieldGroup title="Identitas">
        <TextField name="fullName" label="Nama lengkap" defaultValue={defaults.fullName} autoComplete="off" hint="Sesuai akta kelahiran / kartu pelajar." required />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            name="gender"
            label="Jenis kelamin"
            placeholder="Pilih…"
            defaultValue={defaults.gender}
            options={[
              { value: 'L', label: 'Laki-laki' },
              { value: 'P', label: 'Perempuan' },
            ]}
            required
          />
          <TextField
            name="birthDate"
            label="Tanggal lahir"
            type="date"
            defaultValue={defaults.birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            hint={age !== null ? `Usia ${age} tahun` : undefined}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            name="golongan"
            label="Golongan"
            placeholder="Pilih…"
            defaultValue={defaults.golongan}
            options={GOLONGAN_OPTIONS.map((o) => ({ value: o.value, label: `${o.label} (${o.age})` }))}
            hint={suggestion ? `Saran sesuai usia: ${golonganLabel(suggestion)}` : undefined}
            required
          />
          <TextField name="kta" label="Nomor KTA" defaultValue={defaults.kta ?? ''} hint="Kosongkan bila kartu belum terbit." />
        </div>
      </FieldGroup>

      <FieldGroup title="Keanggotaan">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField name="gudepId" label="Gugus depan" placeholder="Pilih gudep…" defaultValue={defaults.gudepId ?? (gudepOptions.length === 1 ? gudepOptions[0].value : undefined)} options={gudepOptions} required />
          <TextField name="joinedAt" label="Tanggal bergabung" type="date" defaultValue={defaults.joinedAt ?? ''} />
        </div>
      </FieldGroup>

      <FieldGroup
        title="Orang tua / wali"
        description={minor ? 'Wajib diisi: anggota di bawah 18 tahun (UU Pelindungan Data Pribadi).' : 'Wajib untuk anggota di bawah 18 tahun.'}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="guardianName" label="Nama orang tua/wali" defaultValue={defaults.guardianName ?? ''} required={minor} />
          <TextField name="guardianPhone" label="Telepon orang tua/wali" type="tel" inputMode="tel" defaultValue={defaults.guardianPhone ?? ''} required={minor} />
        </div>
        <TextField
          name="guardianConsentAt"
          label="Tanggal persetujuan orang tua/wali"
          type="date"
          defaultValue={defaults.guardianConsentAt ?? ''}
          hint="Tanggal surat/formulir persetujuan pendataan ditandatangani. Simpan dokumennya di gudep."
          required={minor}
        />
      </FieldGroup>

      {showSensitive && (
        <FieldGroup title="Kontak anggota" description="Opsional. Hanya terlihat oleh pengurus yang berwenang.">
          <TextField name="phone" label="Telepon anggota" type="tel" inputMode="tel" defaultValue={defaults.phone ?? ''} />
          <TextAreaField name="address" label="Alamat" rows={2} defaultValue={defaults.address ?? ''} />
        </FieldGroup>
      )}

      <FieldGroup title="Catatan">
        <TextAreaField name="notes" label="Catatan internal" rows={3} defaultValue={defaults.notes ?? ''} hint="Mis. riwayat pindah gudep. Jangan tulis data kesehatan." />
        <CheckboxField
          name="confirmDuplicate"
          label="Saya sudah memeriksa: ini bukan data ganda"
          description="Centang hanya bila sistem memperingatkan kemungkinan data ganda dan Anda yakin orangnya berbeda."
        />
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
};
