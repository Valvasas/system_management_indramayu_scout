import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/public/Breadcrumbs';
import { FileSearch } from 'lucide-react';
import { DocumentTable } from '@/components/public/DocumentTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChips } from '@/components/ui/FilterChips';
import { PageHero } from '@/components/ui/Section';
import { DocumentSearch } from './DocumentSearch';
import { getDocumentCategories, getDocuments } from '@/lib/repositories';

export const metadata: Metadata = {
  title: 'Pusat Dokumen',
  description: 'Petunjuk penyelenggaraan, surat keputusan, formulir, dan template administrasi Kwartir Cabang Indramayu.',
  alternates: { canonical: '/dokumen' },
};

const ALL = 'semua';

export default async function DokumenPage({ searchParams }: { searchParams?: { kategori?: string; cari?: string } }) {
  const categories = await getDocumentCategories();
  const requested = searchParams?.kategori;
  const active = categories.some((c) => c.value === requested) ? (requested as string) : ALL;
  const search = (searchParams?.cari ?? '').slice(0, 100);

  const documents = await getDocuments({
    category: active === ALL ? undefined : active,
    search: search || undefined,
  });

  return (
    <>
      <PageHero
        eyebrow="Layanan"
        scene="forest"
        top={<Breadcrumbs items={[{ label: 'Pusat Dokumen' }]} />}
        title="Pusat dokumen"
        description="Petunjuk penyelenggaraan (Jukran/Juklak), surat keputusan, formulir, dan template administrasi kepramukaan Indramayu."
      />
      <div className="civic-container pb-16 pt-6 sm:pb-24">
        <div className="mb-8 space-y-4">
          <DocumentSearch initialValue={search} />
          <FilterChips
            label="Filter kategori dokumen"
            param="kategori"
            active={active}
            options={[{ value: ALL, label: 'Semua' }, ...categories]}
          />
        </div>

        <p className="mb-4 text-sm text-text-secondary" aria-live="polite">
          {documents.length} dokumen ditemukan
          {search ? ` untuk pencarian "${search}"` : ''}.
        </p>

        {documents.length === 0 ? (
          <EmptyState
            icon={FileSearch}
            title="Tidak ada dokumen yang cocok"
            description="Coba kata kunci lain atau hapus filter kategori untuk melihat seluruh berkas."
            action={{ label: 'Hapus semua filter', href: '/dokumen' }}
          />
        ) : (
          <DocumentTable documents={documents} caption="Daftar dokumen resmi" />
        )}
      </div>
    </>
  );
}
