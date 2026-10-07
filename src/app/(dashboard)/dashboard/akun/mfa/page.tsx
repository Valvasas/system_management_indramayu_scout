import type { Metadata } from 'next';
import { CheckCircle2, ShieldCheck, ShieldOff, Smartphone } from 'lucide-react';
import { ActionForm, SubmitButton } from '@/components/forms/ActionForm';
import { TextField } from '@/components/forms/Fields';
import { MfaCodeForm } from '@/components/dashboard/MfaForms';
import { QrCode } from '@/components/dashboard/QrCode';
import { InfoList, Notice, Panel, PortalHeader } from '@/components/dashboard/ui';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getMfaRecord, recoveryCodesLeft } from '@/features/auth/mfa';
import {
  confirmMfaEnrollmentAction,
  disableMfaAction,
  regenerateRecoveryCodesAction,
  startMfaEnrollmentAction,
} from '@/features/auth/mfa-actions';
import { requiresMfa } from '@/lib/auth/mfa-policy';
import { requireUser } from '@/lib/auth/session';
import { otpauthUri } from '@/lib/auth/totp';
import { formatDate } from '@/lib/format';
import { site } from '@/lib/site';

export const metadata: Metadata = { title: 'Verifikasi dua langkah (MFA)' };

const groupSecret = (s: string) => s.match(/.{1,4}/g)?.join(' ') ?? s;

export default async function MfaPage({ searchParams = {} }: { searchParams?: { wajib?: string; nonaktif?: string; pemulihan?: string } }) {
  const user = await requireUser({ allowMfaSetup: true });
  const record = await getMfaRecord(user.id);
  const required = requiresMfa(user.role);
  const active = Boolean(record?.confirmedAt);
  const left = active ? await recoveryCodesLeft(user.id) : 0;

  return (
    <>
      <PortalHeader
        title="Verifikasi dua langkah (MFA)"
        back={{ href: '/dashboard/akun', label: 'Akun saya' }}
        description="Selain kata sandi, portal meminta kode 6 digit dari aplikasi autentikator di ponsel Anda. Sandi yang bocor saja tidak cukup untuk masuk."
      />

      {(searchParams.wajib === '1' || user.mfa.kind === 'expired') && (
        <Notice tone="warning">Masa tenggang MFA untuk peran Anda sudah habis. Portal terbuka kembali setelah MFA aktif.</Notice>
      )}
      {searchParams.nonaktif === '1' && <Notice tone="info">MFA dinonaktifkan untuk akun ini.</Notice>}
      {searchParams.pemulihan === '1' && active && (
        <Notice tone="warning">Anda masuk dengan kode pemulihan. Sisa kode: {left}. Buat kode baru bila hampir habis.</Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title="Status" className="lg:col-span-2">
          <InfoList
            columns={1}
            items={[
              {
                label: 'MFA',
                value: active ? (
                  <Badge tone="success" icon={CheckCircle2}>
                    Aktif sejak {formatDate(record!.confirmedAt!.toISOString())}
                  </Badge>
                ) : (
                  <Badge tone="neutral" icon={ShieldOff}>
                    Belum aktif
                  </Badge>
                ),
              },
              {
                label: 'Kewajiban',
                value: required ? 'Wajib untuk peran Anda' : 'Sukarela (dianjurkan)',
              },
              ...(active ? [{ label: 'Kode pemulihan tersisa', value: `${left} dari 10` }] : []),
              ...(user.mfa.kind === 'grace' ? [{ label: 'Batas waktu aktivasi', value: formatDate(user.mfa.endsAt.toISOString()) }] : []),
            ]}
          />
        </Panel>

        <div className="space-y-6 lg:col-span-3">
          {!record && (
            <Panel title="Aktifkan MFA">
              <ol className="list-decimal space-y-2 pl-5 text-sm text-text-secondary">
                <li>Pasang aplikasi autentikator di ponsel (mis. Google Authenticator, Aegis, 2FAS, atau Microsoft Authenticator).</li>
                <li>Pindai kode QR yang muncul, lalu masukkan kode 6 digit dari aplikasi.</li>
                <li>Simpan 10 kode pemulihan untuk berjaga bila ponsel hilang.</li>
              </ol>
              <form action={startMfaEnrollmentAction} className="mt-5">
                <Button type="submit">
                  <Smartphone className="h-4 w-4" aria-hidden="true" />
                  Mulai pendaftaran
                </Button>
              </form>
            </Panel>
          )}

          {record && !active && (
            <Panel title="Pindai dengan aplikasi autentikator">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <QrCode
                  value={otpauthUri({ issuer: site.name, account: user.username, secret: record.secret })}
                  label={`Kode QR pendaftaran MFA untuk akun ${user.username}`}
                  className="h-48 w-48 shrink-0 rounded-xl border border-border-subtle"
                />
                <div className="min-w-0 space-y-3 text-sm text-text-secondary">
                  <p>Tidak bisa memindai? Masukkan kunci ini secara manual (jenis: berbasis waktu).</p>
                  <p className="break-all rounded-lg bg-surface-subtle px-3 py-2 font-mono text-base tracking-wider text-text-primary">
                    {groupSecret(record.secret)}
                  </p>
                  <p>Jangan bagikan kunci ini. Siapa pun yang memilikinya bisa membuat kode untuk akun Anda.</p>
                </div>
              </div>
              <div className="mt-6 border-t border-border-subtle pt-5">
                <MfaCodeForm action={confirmMfaEnrollmentAction} inputLabel="Kode 6 digit dari aplikasi" submitLabel="Aktifkan MFA" />
              </div>
            </Panel>
          )}

          {active && (
            <Panel title="Kode pemulihan" description="Membuat kode baru membatalkan semua kode lama.">
              <MfaCodeForm
                action={regenerateRecoveryCodesAction}
                inputLabel="Kode 6 digit dari aplikasi"
                submitLabel="Buat kode pemulihan baru"
              />
            </Panel>
          )}

          {active && !required && (
            <Panel title="Nonaktifkan MFA">
              <ActionForm action={disableMfaAction}>
                <TextField name="code" label="Kode verifikasi atau kode pemulihan" autoComplete="one-time-code" required />
                <SubmitButton variant="secondary" pendingLabel="Memeriksa">
                  <ShieldOff className="h-4 w-4" aria-hidden="true" />
                  Nonaktifkan
                </SubmitButton>
              </ActionForm>
            </Panel>
          )}

          {active && required && (
            <p className="flex items-start gap-2 text-sm text-text-secondary">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Peran Anda wajib MFA, jadi tidak bisa dinonaktifkan sendiri. Ponsel hilang dan kode pemulihan habis? Minta Super Admin mereset
              MFA.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
