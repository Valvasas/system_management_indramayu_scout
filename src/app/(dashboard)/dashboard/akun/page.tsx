import type { Metadata } from 'next';
import { KeyRound } from 'lucide-react';
import { ActionForm, SubmitButton } from '@/components/forms/ActionForm';
import { TextField } from '@/components/forms/Fields';
import { InfoList, Notice, Panel, PortalHeader } from '@/components/dashboard/ui';
import { changePasswordAction } from '@/features/auth/actions';
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/lib/auth/permissions';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password';
import { requireUser } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Akun saya' };

export default async function AkunPage() {
  const user = await requireUser();

  return (
    <>
      <PortalHeader title="Akun saya" description="Informasi akun dan penggantian kata sandi." />
      {user.mustChangePassword && (
        <Notice tone="warning">
          Anda masuk dengan kata sandi sementara. Buat kata sandi baru terlebih dahulu untuk memakai portal.
        </Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title="Informasi akun" className="lg:col-span-2">
          <InfoList
            columns={1}
            items={[
              { label: 'Nama', value: user.name },
              { label: 'Nama pengguna', value: user.username },
              { label: 'Peran', value: ROLE_LABELS[user.role] },
              { label: 'Hak akses', value: <span className="font-normal text-text-secondary">{ROLE_DESCRIPTIONS[user.role]}</span> },
            ]}
          />
          <p className="mt-5 text-sm text-text-secondary">Perubahan nama atau peran dilakukan oleh pengurus Kwarcab.</p>
        </Panel>

        <Panel title="Ganti kata sandi" className="lg:col-span-3">
          <ActionForm action={changePasswordAction}>
            <TextField name="current" label="Kata sandi saat ini" type="password" autoComplete="current-password" required />
            <TextField
              name="next"
              label="Kata sandi baru"
              type="password"
              autoComplete="new-password"
              hint={`Minimal ${MIN_PASSWORD_LENGTH} karakter, kombinasi huruf dan angka. Jangan pakai tanggal lahir.`}
              required
            />
            <TextField name="confirm" label="Ulangi kata sandi baru" type="password" autoComplete="new-password" required />
            <SubmitButton>
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              Simpan kata sandi baru
            </SubmitButton>
            <p className="text-sm text-text-secondary">Setelah diganti, perangkat lain yang masih masuk akan otomatis keluar.</p>
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
