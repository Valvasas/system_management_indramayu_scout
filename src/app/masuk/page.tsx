import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Portal Internal',
  description: 'Portal internal Kwarcab Indramayu belum aktif dan dijadwalkan pada Fase 2.',
  robots: { index: false },
};

export default function MasukPage() {
  return (
    <div className="civic-container py-16 flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-lg text-center">
        <Clock className="mx-auto h-10 w-10 text-neutral-500" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold text-neutral-900 tracking-tight">
          Portal internal belum aktif
        </h1>
        <p className="mt-3 text-neutral-700 leading-relaxed">
          Layanan masuk untuk anggota, pembina, dan staf dijadwalkan pada Fase 2.
          Saat ini situs hanya menyajikan informasi publik, sehingga tidak ada
          akun atau kata sandi yang perlu Anda masukkan.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 min-h-[44px] px-2 text-green-800 font-medium hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-700 rounded"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
