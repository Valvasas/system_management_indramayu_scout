import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LockKeyhole } from 'lucide-react';
import { ActionForm, SubmitButton } from '@/components/forms/ActionForm';
import { TextField } from '@/components/forms/Fields';
import { Breadcrumbs } from '@/components/public/Breadcrumbs';
import { loginAction } from '@/features/auth/actions';
import { getSessionUser } from '@/lib/auth/session';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Masuk Portal',
  description: 'Masuk ke portal pengurus, pembina, dan peserta Kwarcab Indramayu.',
  robots: { index: false, follow: false },
};

export default async function MasukPage() {
  if (await getSessionUser()) redirect('/dashboard');

  return (
    <div className="civic-container py-10 sm:py-16">
      <Breadcrumbs items={[{ label: 'Masuk Portal' }]} />
      <div className="mx-auto mt-6 grid max-w-4xl gap-10 lg:grid-cols-2 lg:items-start">
        <div>
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-tag-surface text-tag-text">
            <LockKeyhole className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-text-primary">Masuk Portal</h1>
          <p className="mt-3 leading-relaxed text-text-secondary">
            Untuk pengurus Kwarcab, staf Kwarran, pembina gudep, dan peserta yang sudah memiliki akun.
          </p>
          <div className="mt-6 rounded-lg border border-border-subtle bg-surface-base p-5">
            <h2 className="font-display text-base font-bold text-text-primary">Belum punya akun?</h2>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              Akun tidak dibuat sendiri. Peserta mendapat akun dari pembina gudep setelah datanya diverifikasi. Staf dan
              pembina menghubungi sekretariat Kwarcab di {site.contact.phone}.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border-subtle bg-surface-base p-6 shadow-sm sm:p-8">
          <ActionForm action={loginAction} aria-label="Formulir masuk portal">
            <TextField name="username" label="Nama pengguna" autoComplete="username" autoCapitalize="none" spellCheck={false} required />
            <TextField name="password" label="Kata sandi" type="password" autoComplete="current-password" required />
            <SubmitButton className="w-full" pendingLabel="Memeriksa">
              Masuk
            </SubmitButton>
            <p className="text-sm text-text-secondary">
              Lupa kata sandi? Minta pengurus yang membuatkan akun Anda untuk meresetnya.
            </p>
          </ActionForm>
        </div>
      </div>
    </div>
  );
}
