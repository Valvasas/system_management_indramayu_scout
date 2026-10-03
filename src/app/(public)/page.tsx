import type { Metadata } from 'next';
import { Hero } from '@/components/public/Hero';
import { QuickAccess } from '@/components/public/QuickAccess';
import { NewsPreview } from '@/components/public/NewsPreview';
import { DocumentCenter } from '@/components/public/DocumentCenter';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: {
    absolute: `${site.name} — ${site.organization}`,
  },
  description: site.description,
  alternates: { canonical: '/' },
};

/**
 * Beranda sengaja ringkas: empat blok yang menjawab kebutuhan utama pengunjung
 * (siapa kami, informasi per golongan, kabar terbaru, dokumen resmi).
 * Agenda, galeri, prestasi, dan peta tetap tersedia lewat menu & footer.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <QuickAccess />
      <NewsPreview />
      <DocumentCenter />
    </>
  );
}
