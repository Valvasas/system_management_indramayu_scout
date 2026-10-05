import React from 'react';
import { Download, Newspaper } from 'lucide-react';
import { ButtonLink } from '../ui/Button';
import { MediaFrame } from '../ui/MediaFrame';

/**
 * Hero beranda: satu judul, satu kalimat, dua aksi.
 * "Berita Terbaru" adalah aksi utama; "Unduh Dokumen" sengaja sekunder (satu primary per konteks).
 */
export const Hero: React.FC = () => (
  <section aria-labelledby="hero-title" className="border-b border-border-subtle bg-surface-base">
    <div className="civic-container grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-text-accent">
          Kwartir Cabang Gerakan Pramuka
        </p>
        <h1
          id="hero-title"
          className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight text-text-primary sm:text-5xl"
        >
          Pusat Informasi &amp; Administrasi Kwarcab Indramayu
        </h1>
        <p className="mt-5 max-w-prose text-lg leading-relaxed text-text-secondary">
          Berita resmi, dokumen, dan layanan administrasi Pramuka Kabupaten Indramayu.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/berita" size="lg" className="w-full sm:w-auto">
            <Newspaper className="h-5 w-5" aria-hidden="true" />
            Berita Terbaru
          </ButtonLink>
          <ButtonLink href="/dokumen" variant="outline" size="lg" className="w-full sm:w-auto">
            <Download className="h-5 w-5" aria-hidden="true" />
            Unduh Dokumen
          </ButtonLink>
        </div>
      </div>

      <div className="lg:col-span-6">
        {/* Foto kegiatan resmi beresolusi tinggi. Privasi: tanpa wajah peserta didik yang dapat dikenali. */}
        <MediaFrame
          src="/images/placeholder-hero.jpg"
          alt="Kegiatan resmi Kwartir Cabang Gerakan Pramuka Indramayu"
          aspect="4/3"
          keepAspect
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="rounded-lg"
          fallbackLabel="Foto kegiatan Kwarcab akan ditampilkan di sini"
        />
      </div>
    </div>
  </section>
);
