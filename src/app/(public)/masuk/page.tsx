import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { KeyRound, LogIn, ShieldCheck } from 'lucide-react';
import { ActionForm, SubmitButton } from '@/components/forms/ActionForm';
import { TextField } from '@/components/forms/Fields';
import { Breadcrumbs } from '@/components/public/Breadcrumbs';
import { SceneStrip } from '@/components/illustrations/Scenes';
import { loginAction } from '@/features/auth/actions';
import { getSessionUser } from '@/lib/auth/session';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Masuk Portal',
  description: 'Masuk ke portal pengurus, pembina, dan peserta Kwarcab Indramayu.',
  robots: { index: false, follow: false },
};

// Wajib dinamis: middleware memberi CSP ber-nonce (src/lib/security/csp.mjs); HTML statis tak membawa nonce.
export const dynamic = 'force-dynamic';

export default async function MasukPage() {
  if (await getSessionUser()) redirect('/dashboard');

  return (
    <div className="topo bg-surface-canvas">
      <div className="civic-container py-8 sm:py-12">
        <Breadcrumbs items={[{ label: 'Masuk Portal' }]} />
        <div className="mx-auto mt-6 grid max-w-5xl overflow-hidden rounded-3xl border border-border-subtle bg-surface-base shadow-lg lg:grid-cols-2">
          {/* Panel suasana: hutan pagi. Dekoratif + informasi siapa yang bisa masuk. */}
          <div className="relative flex flex-col justify-between bg-ill-sky p-7 sm:p-10">
            <div className="relative z-10">
              <p className="eyebrow">Portal Rumah Pramuka</p>
              <h1 className="mt-3 font-display text-display-md font-semibold text-text-primary">Selamat datang kembali</h1>
              <p className="mt-3 max-w-sm leading-relaxed text-text-secondary">
                Untuk pengurus Kwarcab, staf Kwarran, pembina gudep, dan peserta yang sudah memiliki akun.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-text-secondary">
                <li className="flex gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-text-accent" aria-hidden="true" />
                  Setiap akses data anggota tercatat di log aktivitas.
                </li>
                <li className="flex gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-text-accent" aria-hidden="true" />
                  Sesi berakhir otomatis setelah 12 jam.
                </li>
              </ul>
            </div>
            <div className="pointer-events-none -mx-7 -mb-7 mt-8 h-32 sm:-mx-10 sm:-mb-10 lg:h-44">
              <SceneStrip variant="forest" />
            </div>
          </div>

          <div className="p-7 sm:p-10">
            <h2 className="font-display text-2xl font-semibold text-text-primary">Masuk ke akun</h2>
            <ActionForm action={loginAction} aria-label="Formulir masuk portal" className="mt-6">
              <TextField name="username" label="Nama pengguna" autoComplete="username" autoCapitalize="none" spellCheck={false} required />
              <TextField name="password" label="Kata sandi" type="password" autoComplete="current-password" required />
              <SubmitButton className="w-full" pendingLabel="Memeriksa">
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Masuk
              </SubmitButton>
            </ActionForm>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <Link
                href="/masuk/lupa-sandi"
                className="inline-flex min-h-touch items-center justify-center rounded-pill border border-border-subtle px-4 text-sm font-semibold text-text-accent hover:bg-surface-meadow"
              >
                Lupa kata sandi?
              </Link>
              <Link
                href="/masuk/kode"
                className="inline-flex min-h-touch items-center justify-center gap-1.5 rounded-pill border border-border-subtle px-4 text-sm font-semibold text-text-accent hover:bg-surface-meadow"
              >
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                Punya kode akses?
              </Link>
            </div>

            <div className="mt-8 rounded-2xl bg-surface-sand p-5">
              <h3 className="font-semibold text-text-primary">Belum punya akun?</h3>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                Akun tidak dibuat sendiri. Peserta mendapat akun dari pembina gudep setelah datanya diverifikasi. Staf dan pembina
                menghubungi sekretariat Kwarcab di {site.contact.phone}.{' '}
                <Link href="/bergabung" className="font-semibold text-text-accent underline underline-offset-2">
                  Cara bergabung
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
