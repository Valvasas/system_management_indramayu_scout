import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { CompassRose, SceneStrip } from '@/components/illustrations/Scenes';

export const metadata: Metadata = {
  title: 'Halaman tidak ditemukan',
  robots: { index: false },
};

const popular = [
  { label: 'Agenda kegiatan', href: '/agenda' },
  { label: 'Berita terbaru', href: '/berita' },
  { label: 'Pusat dokumen', href: '/dokumen' },
  { label: 'Cari gudep', href: '/wilayah' },
];

/** 404: bukan jalan buntu. Beri kompas (pencarian) dan jalur populer untuk kembali. */
export default function NotFound() {
  return (
    // 404 global berada di luar route group, jadi kerangka publik dipasang di sini.
    <div id="atas" className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="flex-grow">
        <section className="relative overflow-hidden bg-surface-sky">
          <div className="topo absolute inset-0" aria-hidden="true" />
          <div className="civic-container relative flex flex-col items-center pb-40 pt-14 text-center sm:pb-48">
            <div className="h-24 w-24 text-text-accent">
              <CompassRose className="animate-[sway_6s_ease-in-out_infinite]" />
            </div>
            <p className="eyebrow mt-6">Galat 404</p>
            <h1 className="mt-3 font-display text-display-lg font-semibold text-text-primary">Sepertinya kita tersesat di hutan</h1>
            <p className="mt-4 max-w-prose text-lg text-text-secondary">
              Alamat yang Anda tuju tidak tersedia, sudah dipindahkan, atau tautannya keliru. Coba cari, atau ambil salah satu jalur di bawah.
            </p>
            <form action="/cari" role="search" className="relative mt-8 w-full max-w-md">
              <label htmlFor="nf-search" className="sr-only">
                Cari di situs
              </label>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" aria-hidden="true" />
              <input
                id="nf-search"
                name="q"
                type="search"
                placeholder="Cari berita, agenda, dokumen…"
                className="h-12 w-full rounded-pill border border-border-strong bg-surface-base pl-12 pr-4 text-base text-text-primary shadow-sm placeholder:text-text-muted"
              />
            </form>
            <ul className="mt-6 flex flex-wrap justify-center gap-2">
              {popular.map((p) => (
                <li key={p.href}>
                  <Link
                    href={p.href}
                    className="group inline-flex min-h-touch items-center gap-1.5 rounded-pill bg-surface-base px-4 text-sm font-medium text-text-primary shadow-sm hover:text-text-accent"
                  >
                    {p.label}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
            <ButtonLink href="/" className="mt-8">
              Kembali ke beranda
            </ButtonLink>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 sm:h-40">
            <SceneStrip variant="forest" />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
