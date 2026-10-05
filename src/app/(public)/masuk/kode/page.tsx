import type { Metadata } from 'next';
import Link from 'next/link';
import { KeyRound } from 'lucide-react';
import { ActionForm, SubmitButton } from '@/components/forms/ActionForm';
import { TextField } from '@/components/forms/Fields';
import { Breadcrumbs } from '@/components/public/Breadcrumbs';
import { SceneStrip } from '@/components/illustrations/Scenes';
import { redeemAccessCodeAction } from '@/features/auth/access-actions';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password';

export const metadata: Metadata = {
  title: 'Gunakan kode akses',
  robots: { index: false, follow: false },
};

/** Aktivasi akun baru & reset sandi memakai satu alur yang sama: kode + sandi buatan sendiri. */
export default function KodeAksesPage() {
  return (
    <div className="topo bg-surface-canvas">
      <div className="civic-container py-8 sm:py-12">
        <Breadcrumbs items={[{ label: 'Masuk Portal', href: '/masuk' }, { label: 'Kode akses' }]} />
        <div className="mx-auto mt-6 grid max-w-5xl overflow-hidden rounded-3xl border border-border-subtle bg-surface-base shadow-lg lg:grid-cols-2">
          <div className="relative flex flex-col justify-between bg-ill-sky p-7 sm:p-10">
            <div>
              <p className="eyebrow">Aktivasi & pemulihan</p>
              <h1 className="mt-3 font-display text-display-md font-semibold text-text-primary">Punya kode akses?</h1>
              <p className="mt-3 max-w-sm text-text-secondary">
                Kode dari pembina atau pengurus berbentuk <strong className="font-semibold text-text-primary">ABCD-2345</strong>. Kode hanya bisa dipakai sekali dan ada masa
                berlakunya.
              </p>
              <p className="mt-4 max-w-sm text-sm text-text-secondary">
                Kata sandi yang Anda buat hanya Anda yang tahu, bahkan pembina pun tidak. Jangan bagikan ke siapa pun.
              </p>
            </div>
            <div className="pointer-events-none -mx-7 -mb-7 mt-8 h-28 sm:-mx-10 sm:-mb-10">
              <SceneStrip variant="mountain" />
            </div>
          </div>
          <div className="p-7 sm:p-10">
            <h2 className="font-display text-2xl font-semibold text-text-primary">Buat kata sandi Anda</h2>
            <ActionForm action={redeemAccessCodeAction} aria-label="Formulir kode akses" className="mt-6">
              <TextField name="username" label="Nama pengguna" autoComplete="username" autoCapitalize="none" spellCheck={false} required />
              <TextField
                name="code"
                label="Kode akses"
                autoComplete="one-time-code"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="ABCD-2345"
                className="[&_input]:font-mono [&_input]:uppercase [&_input]:tracking-[0.2em]"
                required
              />
              <TextField
                name="next"
                label="Kata sandi baru"
                type="password"
                autoComplete="new-password"
                hint={`Minimal ${MIN_PASSWORD_LENGTH} karakter, kombinasi huruf dan angka. Jangan pakai tanggal lahir.`}
                required
              />
              <TextField name="confirm" label="Ulangi kata sandi baru" type="password" autoComplete="new-password" required />
              <SubmitButton className="w-full" pendingLabel="Memeriksa">
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                Simpan & masuk
              </SubmitButton>
            </ActionForm>
            <p className="mt-6 text-sm text-text-secondary">
              Belum punya kode?{' '}
              <Link href="/masuk/lupa-sandi" className="font-semibold text-text-accent underline underline-offset-2">
                Minta lewat pembina
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
