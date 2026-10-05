'use client';

import React, { useState } from 'react';
import { KeyRound, Save, UserPlus } from 'lucide-react';
import type { Role } from '@/db/schema';
import { ActionForm, SubmitButton } from '@/components/forms/ActionForm';
import { CheckboxField, FieldGroup, SelectField, TextField } from '@/components/forms/Fields';
import { ButtonLink } from '@/components/ui/Button';
import type { FormState } from '@/lib/forms';

type Option = { value: string; label: string };

export const UserForm: React.FC<{
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  roles: { value: Role; label: string; description: string }[];
  kwarranOptions: Option[];
  gudepOptions: Option[];
  defaults?: { name?: string; username?: string; email?: string | null; role?: Role; kwarranId?: string | null; gudepId?: string | null; active?: boolean };
  isNew: boolean;
  /** Akun milik pengguna sendiri: peran & status dikunci. */
  isSelf?: boolean;
}> = ({ action, roles, kwarranOptions, gudepOptions, defaults = {}, isNew, isSelf }) => {
  const [role, setRole] = useState<Role | ''>(defaults.role ?? '');
  const desc = roles.find((r) => r.value === role)?.description;

  return (
    <ActionForm action={action} className="space-y-6">
      <FieldGroup title="Identitas akun">
        <TextField name="name" label="Nama lengkap" defaultValue={defaults.name} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="username" label="Nama pengguna" defaultValue={defaults.username} autoCapitalize="none" spellCheck={false} hint="Dipakai untuk masuk, mis. sri.wahyuni" required />
          <TextField name="email" label="Pos-el" type="email" defaultValue={defaults.email ?? ''} hint="Opsional." />
        </div>
      </FieldGroup>

      <FieldGroup title="Peran & cakupan" description="Peran menentukan fitur; cakupan menentukan data wilayah/gudep mana yang terlihat.">
        {isSelf ? (
          <>
            <p className="text-text-secondary">Peran akun Anda sendiri tidak dapat diubah dari sini.</p>
            <input type="hidden" name="role" value={defaults.role} />
            <input type="hidden" name="kwarranId" value={defaults.kwarranId ?? ''} />
            <input type="hidden" name="gudepId" value={defaults.gudepId ?? ''} />
          </>
        ) : (
          <>
            <SelectField
              name="role"
              label="Peran"
              placeholder="Pilih peran…"
              defaultValue={defaults.role}
              options={roles}
              onChange={(e) => setRole(e.target.value as Role)}
              hint={desc}
              required
            />
            {role === 'STAFF_KWARRAN' && (
              <SelectField name="kwarranId" label="Kwarran yang dikelola" placeholder="Pilih kwarran…" defaultValue={defaults.kwarranId ?? undefined} options={kwarranOptions} required />
            )}
            {role === 'STAFF_GUDEP' && (
              <SelectField name="gudepId" label="Gudep yang dikelola" placeholder="Pilih gudep…" defaultValue={defaults.gudepId ?? undefined} options={gudepOptions} required />
            )}
          </>
        )}
        {isNew || isSelf ? (
          <input type="hidden" name="active" value="on" />
        ) : (
          <CheckboxField name="active" label="Akun aktif" description="Akun nonaktif tidak dapat masuk; sesi yang sedang berjalan langsung diakhiri." defaultChecked={defaults.active ?? true} />
        )}
      </FieldGroup>

      <div className="flex flex-wrap gap-3">
        <SubmitButton>
          {isNew ? <UserPlus className="h-4 w-4" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          {isNew ? 'Buat akun' : 'Simpan perubahan'}
        </SubmitButton>
        <ButtonLink href="/dashboard/pengguna" variant="ghost">
          {isNew ? 'Selesai' : 'Batal'}
        </ButtonLink>
      </div>
      {isNew && <p className="text-sm text-text-secondary">Kode aktivasi sekali pakai dibuat otomatis dan tampil sekali setelah akun dibuat. Pemilik akun membuat kata sandinya sendiri.</p>}
    </ActionForm>
  );
};

export const ResetPasswordForm: React.FC<{ action: (state: FormState, formData: FormData) => Promise<FormState> }> = ({ action }) => (
  <ActionForm action={action}>
    <p className="text-sm text-text-secondary">Terbitkan kode reset sekali pakai (berlaku 24 jam). Pemilik membuat kata sandi barunya sendiri; Anda tidak pernah melihat kata sandinya.</p>
    <SubmitButton variant="outline">
      <KeyRound className="h-4 w-4" aria-hidden="true" />
      Buat kode reset
    </SubmitButton>
  </ActionForm>
);
