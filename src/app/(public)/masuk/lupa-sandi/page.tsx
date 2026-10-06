import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Send } from 'lucide-react';
import { ActionForm, SubmitButton } from '@/components/forms/ActionForm';
import { TextAreaField, TextField } from '@/components/forms/Fields';
import { Breadcrumbs } from '@/components/public/Breadcrumbs';
import { SceneStrip } from '@/components/illustrations/Scenes';
import { requestPasswordResetAction } from '@/features/auth/access-actions';

export const metadata: Metadata = {
  title: 'Lupa kata sandi',
  robots: { index: false, follow: false },
};

const steps = [
  'Isi nama pengguna Anda di formulir ini.',
  'Pembina gudep (untuk peserta) atau pengurus Kwarcab (untuk staf) melihat permintaan Anda di portal.',
  'Mereka memberi Anda kode akses sekali pakai, langsung atau lewat orang tua/wali.',
  'Buka "Punya kode akses?", masukkan kodenya, lalu buat kata sandi baru Anda sendiri.',
];

/** Tanpa email: banyak peserta anak tidak punya email pribadi (V5 §10). */
export default function LupaSandiPage() {
  return (
    <div className="topo bg-surface-canvas">
      <div className="civic-container py-8 sm:py-12">
        <Breadcrumbs items={[{ label: 'Masuk Portal', href: '/masuk' }, { label: 'Lupa kata sandi' }]} />
        <div className="mx-auto mt-6 grid max-w-5xl overflow-hidden rounded-3xl border border-border-subtle bg-surface-base shadow-lg lg:grid-cols-2">
          <div className="relative flex flex-col justify-between bg-ill-sky p-7 sm:p-10">
            <div>
              <p className="eyebrow">Pemulihan akses</p>
              <h1 className="mt-3 font-display text-display-md font-semibold text-text-primary">Lupa kata sandi?</h1>
              <p className="mt-3 text-text-secondary">Tenang, tidak perlu email. Begini caranya:</p>
              <ol className="mt-5 space-y-3">
                {steps.map((s, i) => (
                  <li key={s} className="flex gap-3 text-sm text-text-primary">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-action-primary text-xs font-semibold text-text-on-brand">
                      {i + 1}
                    </span>
                    <span className="pt-1">{s}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="pointer-events-none -mx-7 -mb-7 mt-8 h-28 sm:-mx-10 sm:-mb-10">
              <SceneStrip variant="camp" />
            </div>
          </div>
          <div className="p-7 sm:p-10">
            <h2 className="font-display text-2xl font-semibold text-text-primary">Kirim permintaan</h2>
            <ActionForm action={requestPasswordResetAction} resetOnSuccess aria-label="Formulir lupa kata sandi" className="mt-6">
              <TextField name="username" label="Nama pengguna" autoComplete="username" autoCapitalize="none" spellCheck={false} required />
              <TextAreaField
                name="note"
                label="Keterangan (opsional)"
                rows={3}
                maxLength={200}
                hint="Mis. nama gudep Anda, supaya pembina cepat mengenali."
              />
              <SubmitButton className="w-full" pendingLabel="Mengirim">
                <Send className="h-4 w-4" aria-hidden="true" />
                Kirim permintaan
              </SubmitButton>
            </ActionForm>
            <div className="mt-6 flex flex-col gap-2 text-sm sm:flex-row sm:justify-between">
              <Link
                href="/masuk"
                className="inline-flex min-h-touch items-center gap-1.5 rounded-md font-semibold text-text-accent hover:underline"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Kembali ke halaman masuk
              </Link>
              <Link
                href="/masuk/kode"
                className="inline-flex min-h-touch items-center rounded-md font-semibold text-text-accent hover:underline"
              >
                Sudah punya kode akses?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
