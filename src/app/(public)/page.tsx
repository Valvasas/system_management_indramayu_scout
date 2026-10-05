import type { Metadata } from 'next';
import { DocumentCenter } from '@/components/public/DocumentCenter';
import { AchievementStrip } from '@/components/public/home/AchievementStrip';
import { GalleryMosaic } from '@/components/public/home/GalleryMosaic';
import { GolonganPaths } from '@/components/public/home/GolonganPaths';
import { HomeHero } from '@/components/public/home/HomeHero';
import { JoinCta } from '@/components/public/home/JoinCta';
import { NewsFeature } from '@/components/public/home/NewsFeature';
import { StatsBand } from '@/components/public/home/StatsBand';
import { UpcomingAgenda } from '@/components/public/home/UpcomingAgenda';
import { WilayahTeaser } from '@/components/public/home/WilayahTeaser';
import { site } from '@/lib/site';

/** Angka agregat anggota ikut diperbarui tiap jam (verifikasi anggota tidak memicu revalidasi konten). */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: `${site.name} — ${site.organization}` },
  description: site.description,
  alternates: { canonical: '/' },
};

/**
 * Beranda menjawab lima pertanyaan pengunjung (V5 §12), berurutan:
 * milik siapa (hero) → seberapa besar (angka) → untuk siapa (golongan) →
 * apa yang sedang terjadi (agenda, berita, galeri, prestasi) → ke mana saya lanjut
 * (bergabung, wilayah, dokumen). Latar bergantian + siluet lanskap menggantikan garis pemisah.
 */
export default function Home() {
  return (
    <>
      <HomeHero />
      <StatsBand />
      <GolonganPaths />
      <UpcomingAgenda />
      <NewsFeature />
      <GalleryMosaic />
      <AchievementStrip />
      <JoinCta />
      <WilayahTeaser />
      <DocumentCenter />
    </>
  );
}
