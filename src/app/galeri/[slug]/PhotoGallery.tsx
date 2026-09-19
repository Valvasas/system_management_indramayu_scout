'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ImageOff, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Photo } from '@/types';

export type GalleryPhoto = Photo & { available: boolean };

/**
 * Grid foto + lightbox. Kontrak aksesibilitas (P3-2):
 * role="dialog" + aria-modal, fokus terperangkap, Escape menutup,
 * fokus kembali ke thumbnail pemicu, scroll body terkunci, panah kiri/kanan.
 */
export const PhotoGallery: React.FC<{ photos: GalleryPhoto[]; albumTitle: string }> = ({
  photos,
  albumTitle,
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const lastTrigger = useRef<number | null>(null);

  const isOpen = openIndex !== null;
  const photo = isOpen ? photos[openIndex] : null;

  const close = useCallback(() => setOpenIndex(null), []);

  const step = useCallback(
    (dir: 1 | -1) =>
      setOpenIndex((cur) => (cur === null ? cur : (cur + dir + photos.length) % photos.length)),
    [photos.length],
  );

  useEffect(() => {
    if (!isOpen) return;

    const triggers = triggerRefs.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href]',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      // Kembalikan fokus ke thumbnail yang membuka lightbox.
      if (lastTrigger.current !== null) triggers[lastTrigger.current]?.focus();
    };
  }, [isOpen, close, step]);

  return (
    <>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((p, i) => (
          <li key={p.id}>
            <button
              ref={(el) => {
                triggerRefs.current[i] = el;
              }}
              type="button"
              onClick={() => {
                lastTrigger.current = i;
                setOpenIndex(i);
              }}
              className="group relative block w-full overflow-hidden rounded-lg border border-border-subtle bg-surface-sunken text-left"
              aria-haspopup="dialog"
              aria-label={`Buka foto: ${p.caption}`}
            >
              <span className="block aspect-square">
                {p.available ? (
                  <Image
                    src={p.url}
                    alt={p.altText}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <span className="flex h-full w-full flex-col items-center justify-center gap-2 px-3 text-center">
                    <ImageOff className="h-7 w-7 text-text-muted" aria-hidden="true" />
                    <span className="text-xs text-text-secondary">Foto belum diunggah</span>
                  </span>
                )}
              </span>
              <span className="block p-3 text-xs font-medium text-text-primary">{p.caption}</span>
            </button>
          </li>
        ))}
      </ul>

      {isOpen && photo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Latar gelap sebagai <button>: klik di luar menutup, tanpa memasang
              handler pada elemen non-interaktif. Disembunyikan dari pembaca layar
              karena tombol tutup ber-label sudah ada di dalam dialog. */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={close}
            className="absolute inset-0 cursor-default bg-surface-scrim"
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="lightbox-title"
            className="relative w-full max-w-2xl rounded-xl bg-surface-base p-5 shadow-dialog"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 id="lightbox-title" className="font-display text-lg font-bold text-text-primary">
                  {photo.caption}
                </h2>
                <p className="text-xs text-text-secondary">
                  {albumTitle} · foto {openIndex + 1} dari {photos.length}
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-md text-text-secondary hover:bg-surface-subtle hover:text-text-primary"
                aria-label="Tutup pratinjau foto"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="relative mt-4 aspect-video overflow-hidden rounded-lg bg-surface-sunken">
              {photo.available ? (
                <Image
                  src={photo.url}
                  alt={photo.altText}
                  fill
                  sizes="(max-width: 768px) 100vw, 672px"
                  className="object-contain"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
                  <ImageOff className="h-10 w-10 text-text-muted" aria-hidden="true" />
                  <p className="text-sm text-text-secondary">
                    Berkas foto belum diunggah. Keterangan: {photo.altText}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <Button variant="outline" size="sm" onClick={() => step(-1)}>
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Sebelumnya
              </Button>
              <p className="text-xs text-text-secondary">
                Tekan <kbd className="rounded border border-border-subtle bg-surface-subtle px-1.5 py-0.5 font-mono">Esc</kbd> untuk menutup
              </p>
              <Button variant="outline" size="sm" onClick={() => step(1)}>
                Berikutnya
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
