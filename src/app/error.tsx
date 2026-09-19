'use client';

import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';

/**
 * Batas galat tingkat rute. Pesan untuk pengguna sengaja tidak memuat detail
 * teknis; rincian hanya dicatat ke konsol server/monitoring.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Route error:', error);
  }, [error]);

  return (
    <div className="civic-container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-status-warning-surface text-status-warning-text">
        <AlertTriangle className="h-8 w-8" aria-hidden="true" />
      </span>
      <h1 className="mt-6 font-display text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
        Halaman gagal dimuat
      </h1>
      <p className="mt-4 max-w-prose text-text-secondary">
        Terjadi gangguan saat menyiapkan halaman ini. Silakan coba lagi; bila berulang, laporkan ke
        sekretariat kwarcab.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-text-muted">Kode rujukan: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Coba lagi</Button>
        <ButtonLink href="/kontak" variant="ghost">
          Laporkan gangguan
        </ButtonLink>
      </div>
    </div>
  );
}
