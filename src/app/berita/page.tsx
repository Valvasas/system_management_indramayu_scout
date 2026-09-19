'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { mockNews } from '@/lib/data/mock-data';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';

const ALL = 'Semua';

const formatDate = (isoString: string) => {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
};

export default function BeritaPage() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<string>(ALL);

  const published = mockNews.filter((n) => n.status === 'PUBLISHED');
  const categories = [ALL, ...Array.from(new Set(published.map((n) => n.category)))];
  const filteredNews = filter === ALL ? published : published.filter((n) => n.category === filter);

  return (
    <div className="civic-container py-12">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight mb-3">
          {t('nav.news')}
        </h1>
        <p className="text-neutral-600 max-w-2xl text-base sm:text-lg">
          Kabar terbaru, pengumuman, dan liputan kegiatan Kwartir Cabang Indramayu.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Filter kategori berita">
        {categories.map((c) => {
          const isActive = filter === c;
          return (
            <button
              key={c}
              type="button"
              aria-pressed={isActive}
              onClick={() => setFilter(c)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-green-600 ${
                isActive
                  ? 'bg-green-700 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>

      {filteredNews.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-neutral-500">Belum ada berita pada kategori ini.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((news) => (
            <article
              key={news.id}
              className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden flex flex-col"
            >
              <div className="aspect-video bg-neutral-200">
                {news.coverImage && (
                  <img
                    src={news.coverImage}
                    alt=""
                    className="object-cover w-full h-full"
                  />
                )}
              </div>
              <div className="p-6 flex-grow flex flex-col">
                <div className="mb-2">
                  <Badge variant="brand">{news.category}</Badge>
                </div>
                <h2 className="text-xl font-bold mb-2 line-clamp-2">
                  <Link
                    href={`/berita/${news.slug}`}
                    className="hover:text-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-600 rounded"
                  >
                    {news.title}
                  </Link>
                </h2>
                <p className="text-neutral-600 text-sm mb-4 line-clamp-3">{news.excerpt}</p>
                <div className="mt-auto text-xs text-neutral-500">
                  <time dateTime={news.publishedAt}>{formatDate(news.publishedAt)}</time>
                  {' · '}
                  {news.author}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
