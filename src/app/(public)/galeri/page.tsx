import type { Metadata } from 'next';
import Link from 'next/link';
import { Images, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { CategoryBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { MediaFrame } from '@/components/ui/MediaFrame';
import { PageHeader } from '@/components/ui/Section';
import { getGalleryAlbums } from '@/lib/repositories';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Galeri Dokumentasi',
  description:
    'Rekaman visual perkemahan, upacara, dan kegiatan bakti Pramuka di Kabupaten Indramayu.',
  alternates: { canonical: '/galeri' },
};

export default async function GaleriPage() {
  const albums = await getGalleryAlbums();

  return (
    <div className="civic-container py-12">
      <PageHeader
        title="Galeri dokumentasi"
        description="Rekaman visual perkemahan, upacara, dan kegiatan bakti Pramuka di Kabupaten Indramayu."
      />

      {albums.length === 0 ? (
        <EmptyState
          icon={Images}
          title="Album belum tersedia"
          description="Dokumentasi diunggah setelah kurasi dan pemeriksaan privasi anggota anak selesai."
        />
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => (
            <li key={album.id}>
              <Card as="article" hoverable className="relative flex h-full flex-col">
                <MediaFrame
                  src={album.coverImage}
                  alt=""
                  aspect="4/3"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  fallbackLabel="Foto sampul menyusul"
                >
                  <div className="absolute left-3 top-3">
                    <CategoryBadge>{album.category}</CategoryBadge>
                  </div>
                </MediaFrame>
                <CardContent className="flex flex-1 flex-col">
                  <h2 className="font-display text-lg font-bold leading-snug text-text-primary">
                    <Link
                      href={`/galeri/${album.slug}`}
                      className="stretched-link rounded-md hover:text-text-accent"
                    >
                      {album.title}
                    </Link>
                  </h2>
                  <p className="mt-2 flex-1 text-sm text-text-secondary">{album.description}</p>
                  <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      {album.location}
                    </span>
                    <time dateTime={album.date}>{formatDate(album.date)}</time>
                    <span>{album.photos.length} foto</span>
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
