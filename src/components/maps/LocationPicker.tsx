'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { Crosshair, MapPinOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input, fieldAria } from '@/components/ui/Field';
import { useFieldError } from '@/components/forms/ActionForm';
import { INDRAMAYU_CENTER } from '@/lib/domain';

const BRAND = '#6B4E31';
const round = (n: number) => Math.round(n * 1e6) / 1e6;
const LAT_HINT = 'Contoh: -6.3275';
const LNG_HINT = 'Contoh: 108.3215';

/**
 * Pemilih titik lokasi: klik/ketuk peta, ketik koordinat, atau pakai lokasi perangkat
 * (berguna saat staf sedang berada di gudep). Nilai dikirim lewat input `lat` & `lng`.
 */
export const LocationPicker: React.FC<{ defaultLat: number | null; defaultLng: number | null }> = ({ defaultLat, defaultLng }) => {
  const [lat, setLat] = useState(defaultLat?.toString() ?? '');
  const [lng, setLng] = useState(defaultLng?.toString() ?? '');
  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const api = useRef<{ L: typeof import('leaflet'); map: import('leaflet').Map; marker?: import('leaflet').CircleMarker } | null>(null);
  const latError = useFieldError('lat');
  const lngError = useFieldError('lng');

  // Inisialisasi peta sekali.
  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;
    import('leaflet').then((L) => {
      if (cancelled || !mapRef.current) return;
      const start: [number, number] =
        defaultLat !== null && defaultLng !== null ? [defaultLat, defaultLng] : [INDRAMAYU_CENTER.lat, INDRAMAYU_CENTER.lng];
      const map = L.map(mapRef.current, { scrollWheelZoom: false }).setView(start, defaultLat !== null ? 16 : 10);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; Kontributor OpenStreetMap',
      }).addTo(map);
      map.on('click', (e: import('leaflet').LeafletMouseEvent) => {
        setLat(String(round(e.latlng.lat)));
        setLng(String(round(e.latlng.lng)));
      });
      api.current = { L, map };
      setReady(true); // picu sinkron penanda awal
    });
    return () => {
      cancelled = true;
      api.current?.map.remove();
      api.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sinkronkan penanda dengan nilai input.
  useEffect(() => {
    const a = api.current;
    if (!a) return;
    const la = Number(lat.replace(',', '.'));
    const ln = Number(lng.replace(',', '.'));
    const valid = lat !== '' && lng !== '' && Number.isFinite(la) && Number.isFinite(ln) && Math.abs(la) <= 90 && Math.abs(ln) <= 180;
    if (!valid) {
      a.marker?.remove();
      a.marker = undefined;
      return;
    }
    if (a.marker) a.marker.setLatLng([la, ln]);
    else a.marker = a.L.circleMarker([la, ln], { radius: 10, color: '#FFFFFF', weight: 3, fillColor: BRAND, fillOpacity: 1 }).addTo(a.map);
  }, [lat, lng, ready]);

  const useDevice = () => {
    if (!('geolocation' in navigator)) return setGeoMsg('Perangkat tidak mendukung lokasi.');
    setGeoMsg('Mencari lokasi…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const la = round(pos.coords.latitude);
        const ln = round(pos.coords.longitude);
        setLat(String(la));
        setLng(String(ln));
        api.current?.map.setView([la, ln], 17);
        setGeoMsg(`Lokasi ditemukan (akurasi ±${Math.round(pos.coords.accuracy)} m). Periksa titiknya di peta.`);
      },
      () => setGeoMsg('Lokasi tidak dapat diambil. Izinkan akses lokasi atau klik langsung di peta.'),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  return (
    <div className="space-y-3">
      <div className="h-80 overflow-hidden rounded-lg border border-border-subtle">
        <div
          ref={mapRef}
          role="application"
          aria-label="Peta pemilih lokasi. Klik peta untuk menaruh titik gudep."
          className="h-full w-full"
        />
      </div>
      <p className="text-sm text-text-secondary">Klik/ketuk peta tepat di lokasi pangkalan, atau isi koordinat dari Google Maps.</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={useDevice}>
          <Crosshair className="h-4 w-4" aria-hidden="true" />
          Pakai lokasi saya sekarang
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setLat('');
            setLng('');
          }}
        >
          <MapPinOff className="h-4 w-4" aria-hidden="true" />
          Hapus titik
        </Button>
      </div>
      {geoMsg && (
        <p role="status" className="text-sm text-text-secondary">
          {geoMsg}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="f-lat" label="Lintang (latitude)" error={latError} hint={LAT_HINT}>
          <Input
            id="f-lat"
            name="lat"
            inputMode="decimal"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            {...fieldAria('f-lat', latError, LAT_HINT)}
          />
        </Field>
        <Field id="f-lng" label="Bujur (longitude)" error={lngError} hint={LNG_HINT}>
          <Input
            id="f-lng"
            name="lng"
            inputMode="decimal"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            {...fieldAria('f-lng', lngError, LNG_HINT)}
          />
        </Field>
      </div>
    </div>
  );
};
