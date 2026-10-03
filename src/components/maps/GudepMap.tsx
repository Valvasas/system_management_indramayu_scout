'use client';

import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { INDRAMAYU_CENTER } from '@/lib/domain';

export interface GudepPoint {
  id: string;
  name: string;
  number: string | null;
  lat: number;
  lng: number;
  kwarranName: string;
  activeMembers: number;
}

const BRAND = '#6B4E31';

/**
 * Peta sebaran gudep. Penanda `circleMarker` (bukan ikon bawaan Leaflet yang dimuat dari CDN
 * dan diblokir CSP). Isi popup dibangun lewat DOM + textContent — tidak ada HTML dari data.
 */
const GudepMap: React.FC<{ points: GudepPoint[]; linkBase?: string; label: string }> = ({ points, linkBase = '/dashboard/gudep', label }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    let map: import('leaflet').Map | undefined;
    let cancelled = false;

    import('leaflet').then((L) => {
      if (cancelled || !ref.current) return;
      map = L.map(ref.current, { scrollWheelZoom: false }).setView([INDRAMAYU_CENTER.lat, INDRAMAYU_CENTER.lng], 10);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; Kontributor OpenStreetMap',
      }).addTo(map);

      const bounds: [number, number][] = [];
      for (const p of points) {
        const popup = document.createElement('div');
        const title = document.createElement('a');
        title.href = `${linkBase}/${p.id}`;
        title.textContent = p.name;
        title.style.fontWeight = '700';
        title.style.color = BRAND;
        const meta = document.createElement('div');
        meta.textContent = `${p.number ? `No. ${p.number} · ` : ''}Kwarran ${p.kwarranName} · ${p.activeMembers} anggota aktif`;
        popup.append(title, meta);

        L.circleMarker([p.lat, p.lng], { radius: 8, color: '#FFFFFF', weight: 2, fillColor: BRAND, fillOpacity: 0.95 })
          .addTo(map)
          .bindPopup(popup)
          .bindTooltip(p.name);
        bounds.push([p.lat, p.lng]);
      }
      if (bounds.length === 1) map.setView(bounds[0], 14);
      else if (bounds.length > 1) map.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 });
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [points, linkBase]);

  return <div ref={ref} role="application" aria-label={label} className="h-full w-full" />;
};

export default GudepMap;
