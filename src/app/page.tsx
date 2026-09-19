import type { Metadata } from 'next';
import { Hero } from '@/components/public/Hero';
import { StatsSection } from '@/components/public/StatsSection';
import { AboutPreview } from '@/components/public/AboutPreview';
import { AgendaPreview } from '@/components/public/AgendaPreview';
import { NewsPreview } from '@/components/public/NewsPreview';
import { GalleryPreview } from '@/components/public/GalleryPreview';
import { AchievementPreview } from '@/components/public/AchievementPreview';
import { MapSection } from '@/components/public/MapSection';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: {
    absolute: `${site.name} — ${site.organization}`,
  },
  description: site.description,
  alternates: { canonical: '/' },
};

export default function Home() {
  return (
    <>
      {/* Latar bergantian subtle -> base memisahkan section tanpa garis berulang (P2-4). */}
      <Hero />
      <StatsSection />
      <AgendaPreview />
      <NewsPreview />
      <GalleryPreview />
      <AchievementPreview />
      <AboutPreview />
      <MapSection />
    </>
  );
}
