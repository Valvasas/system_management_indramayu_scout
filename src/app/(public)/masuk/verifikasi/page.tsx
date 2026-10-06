import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { ActionForm, SubmitButton } from '@/components/forms/ActionForm';
import { TextField } from '@/components/forms/Fields';
import { Breadcrumbs } from '@/components/public/Breadcrumbs';
import { SceneStrip } from '@/components/illustrations/Scenes';
import { cancelMfaLoginAction, verifyMfaLoginAction } from '@/features/auth/mfa-actions';
import { getPendingMfaUser } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Verifikasi dua langkah',
  robots: { index: false, follow: false },
};

// Wajib dinamis: membaca sesi tertunda + CSP ber-nonce dari middleware.
export const dynamic = 'force-dynamic';

/** Langkah kedua setelah sandi benar: kode 6 digit dari aplikasi autentikator, atau kode pemulihan. */
export default async function VerifikasiPage() {
  const pending = await getPendingMfaUser();
  if (!pending) redirect('/masuk');

  return (
    <div className="topo bg-surface-canvas">
      <div className="civic-container py-8 sm:py-12">
        <Breadcrumbs items={[{ label: 'Masuk Portal', href: '/masuk' }, { label: 'Verifikasi dua langkah' }]} />
        <div className="mx-auto mt-6 grid max-w-5xl overflow-hidden rounded-3xl border border-border-subtle bg-surface-base shadow-lg lg:grid-cols-2">
          <div className="relative flex flex-col justify-between bg-ill-sky p-7 sm:p-10">
            <div>
              <p className="eyebrow">Langkah kedua</p>
              <h1 className="mt-3 font-display text-display-md font-semibold text-text-primary">Masukkan kode verifikasi</h1>
              <p className="mt-3 max-w-sm text-text-secondary">
                Buka aplikasi autentikator di ponsel Anda dan masukkan kode 6 digit untuk akun{' '}
                <strong className="font-semibold text-text-primary">{pending.username}</strong>. Kode berganti setiap 30 detik.
              </p>
              <p className="mt-4 max-w-sm text-sm text-text-secondary">
                Ponsel hilang? Pakai salah satu kode pemulihan (bentuk ABCD-2345) yang Anda simpan saat mengaktifkan MFA.
              </p>
            </div>
            <div className="pointer-events-none -mx-7 -mb-7 mt-8 h-28 sm:-mx-10 sm:-mb-10">
              <SceneStrip variant="forest" />
            </div>
          </div>
          <div className="p-7 sm:p-10">
            <h2 className="font-display text-2xl font-semibold text-text-primary">Kode dari aplikasi</h2>
            <ActionForm action={verifyMfaLoginAction} aria-label="Formulir kode verifikasi" className="mt-6">
              <TextField
                name="code"
                label="Kode verifikasi atau kode pemulihan"
                autoComplete="one-time-code"
                inputMode="text"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="123456"
                className="[&_input]:font-mono [&_input]:tracking-[0.2em]"
                required
              />
              <SubmitButton className="w-full" pendingLabel="Memeriksa">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Verifikasi & masuk
              </SubmitButton>
            </ActionForm>
            <form action={cancelMfaLoginAction} className="mt-4">
              <button
                type="submit"
                className="inline-flex min-h-touch items-center rounded-lg px-1 text-sm font-semibold text-text-accent underline underline-offset-2"
              >
                Batal, masuk dengan akun lain
              </button>
            </form>
            <p className="mt-4 text-sm text-text-secondary">
              Tidak punya ponsel maupun kode pemulihan? Hubungi Super Admin Kwarcab untuk mereset MFA akun Anda.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
