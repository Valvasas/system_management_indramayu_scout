'use client';

import React from 'react';
import Link from 'next/link';
import { mockGalleryAlbums } from '@/lib/data/mock-data';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function GaleriPage() {
  const { t } = useLanguage();

  return (
    <div className="civic-container py-12">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight mb-3">
          {t('nav.gallery') || 'Galeri Dokumentasi'}
        </h1>
        <p className="text-neutral-600 max-w-2xl text-base sm:text-lg">
          Rekaman visual aktivitas, perkemahan, upacara, dan kegiatan bakti Pramuka di Kabupaten Indramayu.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockGalleryAlbums.map((album) => (
          <Link
            key={album.id}
            href={`/galeri/${album.slug}`}
            className="group block focus:outline-none focus:ring-2 focus:ring-green-600 rounded-lg"
          >
            <Card hoverable className="overflow-hidden h-full flex flex-col transition-all duration-200 group-hover:border-green-300">
              <div className="aspect-[4/3] bg-neutral-200 relative overflow-hidden flex items-center justify-center">
                <span className="text-5xl" aria-hidden="true">🏕️</span>
                <div className="absolute top-3 left-3">
                  <Badge variant="brand">{album.category}</Badge>
                </div>
                <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2.5 py-1 rounded backdrop-blur-sm font-medium">
                  {album.photos.length} Foto
                </div>
              </div>

              <CardContent className="p-5 flex-grow flex flex-col justify-between">
                <div>
                  <h2 className="font-bold text-lg text-neutral-900 group-hover:text-green-700 transition-colors line-clamp-1 mb-1">
                    {album.title}
                  </h2>
                  <p className="text-sm text-neutral-600 line-clamp-2 mb-3">
                    {album.description}
                  </p>
                </div>

                <div className="text-xs text-neutral-500 flex items-center justify-between pt-3 border-t border-neutral-100">
                  <span>📍 {album.location}</span>
                  <time dateTime={album.date}>{album.date}</time>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
