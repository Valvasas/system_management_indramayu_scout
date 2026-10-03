'use client';

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

/** Leaflet hanya di klien; komponen pemanggil tetap Server Component. */
export const GudepMapCanvas = dynamic(() => import('./GudepMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-surface-sunken">
      <MapPin className="h-8 w-8 text-text-muted" aria-hidden="true" />
      <span className="text-sm text-text-secondary">Memuat peta…</span>
    </div>
  ),
});
