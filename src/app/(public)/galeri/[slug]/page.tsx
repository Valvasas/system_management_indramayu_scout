import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/public/Breadcrumbs';
import { PageHero } from '@/components/ui/Section';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays, Images, MapPin, Users } from 'lucide-react';
import { PhotoGallery, type GalleryPhoto } from './PhotoGallery';
import { getGalleryAlbumBySlug, getGalleryAlbumSlugs } from '@/lib/repositories';
import { formatDate } from '@/lib/format';
import { assetExists } from '@/lib/media';
import { absoluteUrl } from '@/lib/site';

interface Params {
  params: { slug: string };
}

/**
 * Slug yang belum ada saat build (konten baru dari CMS) dirender saat diminta, lalu di-cache.
 * Slug yang tidak ada di basis data memanggil notFound() di bawah → 404.
 */
export const dynamicParams = true;

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
    <div>
      <PageHero
        eyebrow={album.category}
        title={album.title}
        description={album.description}
        scene="lake"
        top={<Breadcrumbs items={[{ label: 'Galeri', href: '/galeri' }, { label: album.title }]} />}
      >
        <ul className="flex flex-wrap gap-2 text-sm">
          {[
            { icon: CalendarDays, text: formatDate(album.date) },
            { icon: MapPin, text: album.location },
            { icon: Users, text: album.organizer },
            { icon: Images, text: `${album.photos.length} foto` },
          ].map(({ icon: Icon, text }) => (
            <li key={text} className="inline-flex items-center gap-1.5 rounded-pill bg-surface-base px-3 py-1.5 font-medium text-text-secondary shadow-sm">
              <Icon className="h-4 w-4 text-text-accent" aria-hidden="true" />
              {text}
            </li>
          ))}
        </ul>
      </PageHero>

      <div className="civic-container pb-16 pt-6 sm:pb-24">
      <PhotoGallery photos={photos} albumTitle={album.title} />
      <Link href="/galeri" className="mt-10 inline-flex min-h-touch items-center gap-2 rounded-md text-sm font-semibold text-text-accent hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Semua album
      </Link>
      </div>
    </div>
  );
}
