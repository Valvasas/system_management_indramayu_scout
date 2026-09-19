import React from 'react';
import Image from 'next/image';
import { ImageOff, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { assetExists } from '@/lib/media';

const aspects = {
  video: 'aspect-video',
  square: 'aspect-square',
  portrait: 'aspect-[3/4]',
  wide: 'aspect-[3/1]',
  '4/3': 'aspect-[4/3]',
} as const;

export interface MediaFrameProps {
  src?: string | null;
  /** Alt deskriptif. Kosongkan ("") hanya bila gambar murni dekoratif. */
  alt: string;
  aspect?: keyof typeof aspects;
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** Kalimat yang tampil saat berkas gambar belum diunggah. */
  fallbackLabel?: string;
  fallbackIcon?: LucideIcon;
  children?: React.ReactNode;
}

/**
 * Bingkai media dengan rasio tetap (mencegah CLS — P4-2) yang merender
 * `next/image` bila asetnya ada, dan empty state jujur bila belum.
 *
 * Komponen server: memakai `assetExists` yang membaca filesystem.
 */
export const MediaFrame: React.FC<MediaFrameProps> = ({
  src,
  alt,
  aspect = 'video',
  sizes = '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw',
  priority = false,
  className,
  fallbackLabel = 'Dokumentasi foto belum diunggah',
  fallbackIcon: FallbackIcon = ImageOff,
  children,
}) => {
  const available = assetExists(src);
  // Empty state tidak perlu setinggi fotonya: pita pendek menyampaikan hal yang
  // sama tanpa meninggalkan blok abu raksasa di tengah halaman.
  const ratio = available ? aspects[aspect] : aspects.wide;

  return (
    <div className={cn('relative overflow-hidden bg-surface-sunken', ratio, className)}>
      {available ? (
        <Image src={src as string} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
          <FallbackIcon className="h-8 w-8 text-text-muted" aria-hidden="true" />
          <span className="text-xs text-text-secondary">{fallbackLabel}</span>
        </div>
      )}
      {children}
    </div>
  );
};
