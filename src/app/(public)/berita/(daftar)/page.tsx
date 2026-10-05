import type { Metadata } from 'next';
import Link from 'next/link';
import { Newspaper } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { CategoryBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChips } from '@/components/ui/FilterChips';
import { MediaFrame } from '@/components/ui/MediaFrame';
import { PageHeader } from '@/components/ui/Section';
import { getNews, getNewsCategories } from '@/lib/repositories';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Berita & Warta Pramuka',
  description:
    'Kabar terbaru, pengumuman, dan liputan kegiatan Kwartir Cabang Gerakan Pramuka Indramayu.',
  alternates: { canonical: '/berita' },
};

const ALL = 'semua';

export default async function BeritaPage({
  searchParams,
}: {
  searchParams?: { kategori?: string };
}) {
  const categories = await getNewsCategories();
  const requested = searchParams?.kategori;
  // Nilai tak dikenal diperlakukan sebagai "semua", bukan hasil kosong yang membingungkan.
  const active = categories.some((c) => c.value === requested) ? (requested as string) : ALL;
  const news = await getNews({ category: active === ALL ? undefined : active });

  return (
    <div className="civic-container py-12">
      <PageHeader
        title="Berita & warta pramuka"
        description="Kabar terbaru, pengumuman, dan liputan kegiatan Kwartir Cabang Indramayu."
      />

      <div className="mb-8">
        <FilterChips
          label="Filter kategori berita"
          param="kategori"
          active={active}
          options={[{ value: ALL, label: 'Semua' }, ...categories]}
        />
      </div>

      <p className="mb-4 text-sm text-text-secondary" aria-live="polite">
        {news.length} berita ditampilkan
        {active === ALL ? '' : ` pada kategori ${categories.find((c) => c.value === active)?.label}`}.
      </p>

      {news.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="Belum ada berita pada kategori ini"
          description="Coba pilih kategori lain, atau lihat seluruh warta yang sudah terbit."
          action={{ label: 'Tampilkan semua berita', href: '/berita' }}
        />
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {news.map((item) => (
            <li key={item.id}>
              <Card as="article" hoverable className="relative flex h-full flex-col">
                <MediaFrame
                  src={item.coverImage}
                  alt=""
                  aspect="video"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  fallbackLabel="Foto dokumentasi menyusul"
                />
                <CardContent className="flex flex-1 flex-col">
                  <CategoryBadge className="self-start">{item.category}</CategoryBadge>
                  <h2 className="mt-3 font-display text-lg font-bold leading-snug text-text-primary">
                    <Link
                      href={`/berita/${item.slug}`}
                      className="stretched-link rounded-md hover:text-text-accent"
                    >
                      {item.title}
                    </Link>
                  </h2>
                  <p className="mt-2 flex-1 text-sm text-text-secondary">{item.excerpt}</p>
                  <p className="mt-4 text-xs text-text-secondary">
                    <time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time>
                    {' · '}
                    {item.author}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
