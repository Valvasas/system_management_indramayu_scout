import React from 'react';
import Link from 'next/link';
import { Images } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { MediaFrame } from '../ui/MediaFrame';
import { Section } from '../ui/Section';
import { getGalleryAlbums } from '@/lib/repositories';

export const GalleryPreview = async () => {
  const albums = await getGalleryAlbums(4);

  return (
    <Section
      id="galeri"
      title="Galeri kegiatan"
      description="Dokumentasi perkemahan, upacara, dan kegiatan bakti."
      surface="subtle"
      action={{ label: 'Semua album', href: '/galeri' }}
    >
      {albums.length === 0 ? (
        <EmptyState
          icon={Images}
          title="Album belum tersedia"
          description="Dokumentasi kegiatan akan diunggah setelah proses kurasi dan pemeriksaan privasi selesai."
        />
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {albums.map((album) => (
            <li key={album.id}>
              <Link
                href={`/galeri/${album.slug}`}
                className="group block overflow-hidden rounded-lg border border-border-subtle bg-surface-base"
              >
                <MediaFrame
                  src={album.coverImage}
                  alt=""
                  aspect="square"
                  sizes="(max-width: 768px) 50vw, 25vw"
                  fallbackLabel="Foto menyusul"
                />
                <div className="p-3">
                  <h3 className="text-sm font-semibold leading-snug text-text-primary group-hover:text-text-accent">
                    {album.title}
                  </h3>
                  <p className="mt-1 text-xs text-text-secondary">{album.photos.length} foto</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
};
