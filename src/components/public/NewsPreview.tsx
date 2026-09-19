import React from 'react';
import Link from 'next/link';
import { Newspaper } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { CategoryBadge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { MediaFrame } from '../ui/MediaFrame';
import { Section } from '../ui/Section';
import { getNews } from '@/lib/repositories';
import { formatDate } from '@/lib/format';

export const NewsPreview = async () => {
  const news = await getNews({ limit: 3 });

  return (
    <Section
      id="berita"
      title="Warta pramuka"
      description="Kabar kegiatan, pengumuman, dan liputan kwartir cabang."
      action={{ label: 'Semua berita', href: '/berita' }}
    >
      {news.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="Belum ada warta terbit"
          description="Berita kegiatan akan tayang di sini setelah dipublikasikan humas kwarcab."
        />
      ) : (
        <ul className="grid gap-6 md:grid-cols-3">
          {news.map((item) => (
            <li key={item.id}>
              <Card as="article" hoverable className="relative flex h-full flex-col">
                <MediaFrame
                  src={item.coverImage}
                  alt=""
                  aspect="video"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  fallbackLabel="Foto dokumentasi menyusul"
                />
                <CardContent className="flex flex-1 flex-col">
                  <CategoryBadge className="self-start">{item.category}</CategoryBadge>
                  <h3 className="mt-3 font-display text-lg font-bold leading-snug text-text-primary">
                    <Link href={`/berita/${item.slug}`} className="rounded-md hover:text-text-accent">
                      {item.title}
                    </Link>
                  </h3>
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
    </Section>
  );
};
