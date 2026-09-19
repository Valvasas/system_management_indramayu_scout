'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { mockGalleryAlbums } from '@/lib/data/mock-data';
import { Camera, ChevronLeft, ChevronRight, Image as ImageIcon, X } from 'lucide-react';
import { Photo } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function DetailGaleriPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const album = mockGalleryAlbums.find((a) => a.slug === slug);
  const [activePhoto, setActivePhoto] = useState<Photo | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const isOpen = activePhoto !== null;
  const photos = album?.photos ?? [];

  const step = (dir: 1 | -1) =>
    setActivePhoto((cur) => {
      if (!cur || photos.length === 0) return cur;
      const i = photos.findIndex((p) => p.id === cur.id);
      return photos[(i + dir + photos.length) % photos.length];
    });

  // Buka: simpan pemicu, kunci scroll, fokus ke tombol tutup. Tutup: kembalikan fokus.
  useEffect(() => {
    if (!isOpen) return;
    triggerRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      triggerRef.current?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActivePhoto(null);
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'Tab' && dialogRef.current) {
        const f = dialogRef.current.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])');
        if (f.length === 0) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, photos.length]);

  if (!album) {
    return (
      <div className="civic-container py-20 text-center">
        <h1 className="text-2xl font-bold text-neutral-800 mb-4">Album Tidak Ditemukan</h1>
        <p className="text-neutral-600 mb-6">Album foto yang Anda tuju belum tersedia atau telah dipindahkan.</p>
        <Link href="/galeri">
          <Button variant="primary">Kembali ke Galeri</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="civic-container py-12">
      <nav className="mb-6" aria-label="Breadcrumb">
        <Link
          href="/galeri"
          className="text-green-700 font-medium inline-flex items-center gap-1.5 hover:underline focus:outline-none focus:ring-2 focus:ring-green-600 rounded"
        >
          <span aria-hidden="true">&larr;</span> Kembali ke Galeri Kegiatan
        </Link>
      </nav>

      <header className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="brand">{album.category}</Badge>
          <span className="text-sm text-neutral-500">{album.date} • {album.location}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-3">{album.title}</h1>
        <p className="text-neutral-600 max-w-3xl text-base sm:text-lg leading-relaxed">{album.description}</p>
        <p className="text-xs text-neutral-500 mt-2 font-medium">Penyelenggara: {album.organizer} • Total: {album.photos.length} Foto Dokumentasi</p>
      </header>

      {/* Photos Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {album.photos.map((photo) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setActivePhoto(photo)}
            className="group aspect-square bg-neutral-100 rounded-lg overflow-hidden relative border border-neutral-200 text-left focus:outline-none focus:ring-2 focus:ring-green-600 flex flex-col justify-end p-4 hover:shadow-md transition-all min-h-[44px]"
            aria-label={`Buka foto: ${photo.caption}`}
          >
            <div className="absolute inset-0 flex items-center justify-center text-neutral-400 bg-neutral-100 group-hover:scale-105 transition-transform duration-300">
              <Camera className="h-10 w-10" aria-hidden="true" />
            </div>
            <div className="relative z-10 bg-black/60 backdrop-blur-sm p-2 rounded text-white text-xs">
              <p className="font-semibold line-clamp-1">{photo.caption}</p>
              <p className="text-[10px] text-neutral-300 line-clamp-1">{photo.altText}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      {activePhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activePhoto.caption}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6"
          onClick={() => setActivePhoto(null)}
        >
          <div
            ref={dialogRef}
            className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">{activePhoto.caption}</h3>
                <p className="text-xs text-neutral-500 mt-0.5">{activePhoto.altText}</p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setActivePhoto(null)}
                className="text-neutral-500 hover:text-neutral-800 p-2 rounded-lg hover:bg-neutral-100 transition-colors focus:outline-none focus:ring-2 focus:ring-green-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Tutup pratinjau foto"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="aspect-video bg-neutral-900 rounded-lg flex items-center justify-center text-neutral-400 mb-4">
              <ImageIcon className="h-14 w-14" aria-hidden="true" />
            </div>

            <div className="flex justify-between items-center gap-2 pb-3">
              <Button type="button" variant="outline" onClick={() => step(-1)} aria-label="Foto sebelumnya">
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button type="button" variant="outline" onClick={() => step(1)} aria-label="Foto berikutnya">
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            <div className="flex justify-between items-center text-xs text-neutral-500 pt-2 border-t border-neutral-100">
              <span>{album.title}</span>
              <span>Tekan <kbd className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 rounded font-mono">ESC</kbd> untuk menutup</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
