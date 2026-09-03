import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="civic-container py-20 min-h-[65vh] flex flex-col items-center justify-center text-center">
      <div className="w-20 h-20 rounded-full bg-green-50 text-green-700 flex items-center justify-center text-4xl mb-6 shadow-sm border border-green-200">
        🧭
      </div>
      <span className="text-xs font-bold text-green-700 uppercase tracking-widest bg-green-100 px-3 py-1 rounded-full mb-3">
        Kode Galat: 404
      </span>
      <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight mb-3">
        Waduh, Salah Jejak!
      </h1>
      <p className="text-neutral-600 max-w-md text-base sm:text-lg mb-8 leading-relaxed">
        Halaman atau rute yang Kakak tuju sepertinya tidak ditemukan, telah dipindahkan, atau alamat tautannya keliru.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/">
          <Button variant="primary">
            Kembali ke Beranda
          </Button>
        </Link>
        <Link href="/kontak">
          <Button variant="outline">
            Hubungi Bantuan
          </Button>
        </Link>
      </div>
    </div>
  );
}
