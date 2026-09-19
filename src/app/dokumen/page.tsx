import type { Metadata } from 'next';
import { Download, FileSearch, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { FileTypeBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChips } from '@/components/ui/FilterChips';
import { PageHeader } from '@/components/ui/Section';
import { DocumentSearch } from './DocumentSearch';
import { getDocumentCategories, getDocuments } from '@/lib/repositories';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Pusat Dokumen',
  description:
    'Petunjuk penyelenggaraan, surat keputusan, formulir, dan template administrasi Kwartir Cabang Indramayu.',
  alternates: { canonical: '/dokumen' },
};

const ALL = 'semua';

export default async function DokumenPage({
  searchParams,
}: {
  searchParams?: { kategori?: string; cari?: string };
}) {
  const categories = await getDocumentCategories();
  const requested = searchParams?.kategori;
  const active = categories.some((c) => c.value === requested) ? (requested as string) : ALL;
  const search = (searchParams?.cari ?? '').slice(0, 100);

  const documents = await getDocuments({
    category: active === ALL ? undefined : active,
    search: search || undefined,
  });

  return (
    <div className="civic-container py-12">
      <PageHeader
        title="Pusat dokumen"
        description="Petunjuk penyelenggaraan (Jukran/Juklak), surat keputusan, formulir, dan template administrasi kepramukaan Indramayu."
      />

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
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <li key={doc.id}>
              <Card as="article" hoverable className="flex h-full flex-col">
                <CardContent className="flex flex-1 flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <FileTypeBadge type={doc.type} />
                    <span className="text-xs text-text-secondary">{doc.size}</span>
                  </div>

                  <h2 className="mt-3 font-display text-base font-bold leading-snug text-text-primary">
                    {doc.title}
                  </h2>
                  <p className="mt-2 flex-1 text-sm text-text-secondary">{doc.description}</p>

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-border-subtle pt-4">
                    <span className="text-xs text-text-secondary">
                      Rilis <time dateTime={doc.date}>{formatDate(doc.date)}</time>
                    </span>

                    {doc.available ? (
                      <a
                        href={doc.url}
                        download
                        {...(doc.isExternal ? { rel: 'noopener noreferrer' } : {})}
                        className="inline-flex min-h-touch items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-text-accent hover:underline"
                        aria-label={`Unduh ${doc.title}, format ${doc.type}, ukuran ${doc.size}`}
                      >
                        <Download className="h-4 w-4" aria-hidden="true" />
                        Unduh
                      </a>
                    ) : (
                      // Tautan '#' atau host di luar allowlist tidak pernah dirender
                      // sebagai tombol unduh (P1-7).
                      <span className="inline-flex min-h-touch items-center gap-1.5 px-2 text-xs font-medium text-text-secondary">
                        <Lock className="h-4 w-4" aria-hidden="true" />
                        Berkas belum diunggah
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
