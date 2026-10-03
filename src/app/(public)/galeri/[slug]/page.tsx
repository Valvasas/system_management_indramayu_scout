import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { CategoryBadge } from '@/components/ui/Badge';
import { PhotoGallery, type GalleryPhoto } from './PhotoGallery';
import { getGalleryAlbumBySlug, getGalleryAlbumSlugs } from '@/lib/repositories';
import { formatDate } from '@/lib/format';
import { assetExists } from '@/lib/media';
import { absoluteUrl } from '@/lib/site';

interface Params {
  params: { slug: string };
}

/** Slug di luar daftar -> 404 sungguhan, bukan halaman galat berstatus 200. */
export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await getGalleryAlbumSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const album = await getGalleryAlbumBySlug(params.slug);
  if (!album) return { title: 'Album tidak ditemukan', robots: { index: false } };

  const url = `/galeri/${album.slug}`;
  return {
    title: album.title,
    description: album.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: album.title,
      description: album.description,
      url: absoluteUrl(url),
    },
  };
}

export default async function DetailGaleriPage({ params }: Params) {
  const album = await getGalleryAlbumBySlug(params.slug);
  if (!album) notFound();

  // Ketersediaan berkas diperiksa di server; klien hanya menerima hasilnya.
  const photos: GalleryPhoto[] = album.photos.map((p) => ({ ...p, available: assetExists(p.url) }));

  return (
    <div className="civic-container py-12">
      <nav aria-label="Remah roti" className="mb-6">
        <Link
          href="/galeri"
          className="inline-flex min-h-touch items-center gap-2 rounded-md text-sm font-medium text-text-accent hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke galeri
        </Link>
      </nav>

      <header className="mb-8 max-w-3xl">
        <CategoryBadge>{album.category}</CategoryBadge>
        <h1 className="mt-4 font-display text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
          {album.title}
        </h1>
        <p className="mt-3 civic-prose">{album.description}</p>
        <p className="mt-3 text-sm text-text-secondary">
          <time dateTime={album.date}>{formatDate(album.date)}</time> · {album.location} ·
          Penyelenggara {album.organizer} · {album.photos.length} foto
        </p>
      </header>

      <PhotoGallery photos={photos} albumTitle={album.title} />
    </div>
  );
}
