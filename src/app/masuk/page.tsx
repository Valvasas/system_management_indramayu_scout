import type { Metadata } from 'next';
import { Clock } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Portal Internal',
  description: 'Portal internal Kwarcab Indramayu belum aktif dan dijadwalkan pada Fase 2.',
  robots: { index: false, follow: false },
};

export default function MasukPage() {
  return (
    <div className="civic-container flex min-h-[60vh] items-center justify-center py-16">
      <div className="w-full max-w-lg text-center">
        <Clock className="mx-auto h-10 w-10 text-text-muted" aria-hidden="true" />
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-text-primary">
          Portal internal belum aktif
        </h1>
        <p className="mt-3 leading-relaxed text-text-secondary">
          Layanan masuk untuk anggota, pembina, dan staf dijadwalkan pada Fase 2. Saat ini situs
          hanya menyajikan informasi publik, sehingga tidak ada akun atau kata sandi yang perlu Anda
          masukkan di mana pun.
        </p>
        <ButtonLink href="/" variant="ghost" className="mt-6">
          Kembali ke beranda
        </ButtonLink>
      </div>
    </div>
  );
}
