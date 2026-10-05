import React from 'react';
import Link from 'next/link';
import { Images } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { MediaFrame } from '@/components/ui/MediaFrame';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { formatDate } from '@/lib/format';
import { getGalleryAlbums } from '@/lib/repositories';
import { cn } from '@/lib/utils';

/** Galeri pilihan: mosaik dengan satu album besar, sisanya kecil. */
export async function GalleryMosaic() {
  const albums = await getGalleryAlbums(5);

  return (
    <Section
      id="galeri-pilihan"
      eyebrow="Galeri"
      title="Momen di bawah langit terbuka"
      description="Dokumentasi perkemahan, upacara, dan bakti. Setiap foto melewati pemeriksaan privasi sebelum tayang."
      surface="sand"
      action={{ label: 'Semua album', href: '/galeri' }}
    >
      {albums.length === 0 ? (
        <EmptyState icon={Images} title="Album belum tersedia" description="Dokumentasi kegiatan akan diunggah setelah proses kurasi dan pemeriksaan privasi selesai." />
      ) : (
        <ul className="grid auto-rows-[11rem] grid-cols-2 gap-4 sm:auto-rows-[13rem] lg:grid-cols-4">
          {albums.map((album, i) => (
            <Reveal
              as="li"
              key={album.id}
              delay={i * 70}
              className={cn(i === 0 && 'col-span-2 row-span-2', i === 3 && albums.length === 4 && 'col-span-2')}
            >
              <Link href={`/galeri/${album.slug}`} className="group relative block h-full overflow-hidden rounded-2xl bg-surface-sunken">
                <MediaFrame
                  src={album.coverImage}
                  alt=""
                  aspect="square"
                  keepAspect
                  className="!aspect-auto h-full transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  sizes={i === 0 ? '(max-width: 1024px) 100vw, 50vw' : '(max-width: 1024px) 50vw, 25vw'}
                  fallbackLabel="Foto menyusul"
                />
                {/* Label di pita padat (bukan teks di atas foto) agar kontras selalu terjamin. */}
                <span className="absolute inset-x-3 bottom-3 rounded-xl bg-surface-base px-3 py-2 shadow-md">
                  <span className={cn('block font-semibold leading-snug text-text-primary group-hover:text-text-accent', i === 0 ? 'text-base sm:text-lg' : 'text-sm')}>
                    {album.title}
                  </span>
                  <span className="block text-xs text-text-secondary">
                    {formatDate(album.date)} · {album.photos.length} foto
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      )}
    </Section>
  );
}
