import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ButtonLink } from '../ui/Button';

/**
 * Satu aksi utama per konteks (P2-3): hanya "Lihat Agenda Kegiatan" yang
 * berbobot penuh; aksi kedua sengaja subordinat (ghost + panah).
 */
export const Hero: React.FC = () => (
  <section aria-labelledby="hero-title" className="bg-surface-subtle">
    <div className="civic-container py-16 sm:py-24 lg:py-28">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-text-accent">
          Portal resmi Kwartir Cabang
        </p>
        <h1
          id="hero-title"
          className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary"
        >
          Rumah digital Gerakan Pramuka Indramayu
        </h1>
        <p className="mt-6 max-w-prose text-lg text-text-secondary leading-relaxed">
          Jadwal kegiatan, warta kwartir, dokumen resmi, dan layanan informasi bagi anggota,
          pembina, gugus depan, serta masyarakat Kabupaten Indramayu.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <ButtonLink href="/agenda" size="lg" className="w-full sm:w-auto">
            Lihat Agenda Kegiatan
          </ButtonLink>
          <ButtonLink href="/berita" variant="ghost" size="lg" className="w-full sm:w-auto">
            Baca warta terbaru
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </ButtonLink>
        </div>
      </div>
    </div>
  </section>
);
