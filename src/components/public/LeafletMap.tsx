'use client';

import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

export interface LeafletMapProps {
  lat: number;
  lng: number;
  label: string;
}

/**
 * Peta OpenStreetMap. Memakai `circleMarker`, bukan marker bawaan Leaflet,
 * karena ikon bawaan dimuat dari CDN pihak ketiga yang diblokir CSP.
 */
const LeafletMap: React.FC<LeafletMapProps> = ({ lat, lng, label }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let map: import('leaflet').Map | undefined;
    let cancelled = false;

    import('leaflet').then((L) => {
      if (cancelled || !containerRef.current) return;

      map = L.map(containerRef.current, { scrollWheelZoom: false }).setView([lat, lng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; Kontributor OpenStreetMap',
      }).addTo(map);

      L.circleMarker([lat, lng], {
        radius: 10,
        color: '#15803D',
        fillColor: '#15803D',
        fillOpacity: 0.85,
        weight: 3,
      })
        .addTo(map)
        .bindPopup(label);
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [lat, lng, label]);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label={`Peta lokasi ${label}`}
      className="h-full w-full"
    />
  );
};

export default LeafletMap;
