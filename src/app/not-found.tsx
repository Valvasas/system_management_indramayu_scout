import React from 'react';
import type { Metadata } from 'next';
import { Compass } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Halaman tidak ditemukan',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="civic-container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-action-secondary text-text-accent">
        <Compass className="h-8 w-8" aria-hidden="true" />
      </span>
      <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-text-secondary">
        Galat 404
      </p>
      <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-4 max-w-prose text-text-secondary">
        Alamat yang Anda tuju tidak tersedia, sudah dipindahkan, atau tautannya keliru.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <ButtonLink href="/">Kembali ke beranda</ButtonLink>
        <ButtonLink href="/kontak" variant="ghost">
          Hubungi sekretariat
        </ButtonLink>
      </div>
    </div>
  );
}
