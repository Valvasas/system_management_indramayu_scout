'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';
import type { LeafletMapProps } from './LeafletMap';

/**
 * Leaflet menyentuh `window`, jadi hanya dimuat di klien. Dipisah ke komponen
 * klien tersendiri agar halaman pemanggil tetap Server Component.
 */
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-surface-sunken">
      <MapPin className="h-8 w-8 text-text-muted" aria-hidden="true" />
      <span className="text-xs text-text-secondary">Memuat peta…</span>
    </div>
  ),
});

export const MapCanvas: React.FC<LeafletMapProps> = (props) => <LeafletMap {...props} />;
