import React from 'react';
import Link from 'next/link';
import { Newspaper } from 'lucide-react';
import { Card } from '../ui/Card';
import { CategoryBadge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { MediaFrame } from '../ui/MediaFrame';
import { Section } from '../ui/Section';
import { getNews } from '@/lib/repositories';
import { formatDate } from '@/lib/format';

/** Tiga berita terbaru. Kartu hanya memuat yang perlu: foto, tanggal, kategori, judul. */
export const NewsPreview = async () => {
  const news = await getNews({ limit: 3 });

  return (
    <Section
      id="berita-terbaru"
      title="Berita terbaru"
      action={{ label: 'Semua berita', href: '/berita' }}
    >
      {news.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="Belum ada berita terbit"
          description="Berita kegiatan akan tayang di sini setelah dipublikasikan humas kwarcab."
        />
      ) : (
        <ul className="grid gap-6 md:grid-cols-3">
          {news.map((item) => (
            <li key={item.id}>
              <Card as="article" hoverable className="group relative flex h-full flex-col shadow-sm">
                <MediaFrame
                  src={item.coverImage}
                  alt=""
                  aspect="video"
                  keepAspect
                  sizes="(max-width: 768px) 100vw, 33vw"
                  fallbackLabel="Foto menyusul"
                />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <CategoryBadge>{item.category}</CategoryBadge>
                    <time dateTime={item.publishedAt} className="text-sm text-text-secondary">
                      {formatDate(item.publishedAt)}
                    </time>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-bold leading-snug text-text-primary">
                    <Link
                      href={`/berita/${item.slug}`}
                      className="stretched-link rounded-lg group-hover:text-text-accent"
                    >
                      {item.title}
                    </Link>
                  </h3>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
};
