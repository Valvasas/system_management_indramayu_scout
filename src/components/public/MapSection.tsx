import React from 'react';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { ButtonLink } from '../ui/Button';
import { Section } from '../ui/Section';
import { MapCanvas } from './MapCanvas';
import { site } from '@/lib/site';

// Titik perkiraan sekretariat (kawasan Simpang Lima Indramayu).
export const SECRETARIAT_COORDS = { lat: -6.3266, lng: 108.3245 };

export const MapSection: React.FC = () => (
  <Section
    id="lokasi"
    title="Lokasi sekretariat"
    description="Pusat layanan dan informasi Kwartir Cabang Indramayu."
    emphasis="primary"
  >
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="h-80 overflow-hidden rounded-lg border border-border-subtle lg:col-span-2 lg:h-full lg:min-h-[22rem]">
        <MapCanvas
          lat={SECRETARIAT_COORDS.lat}
          lng={SECRETARIAT_COORDS.lng}
          label={`Sekretariat ${site.shortName}`}
        />
      </div>

      <Card>
        <CardContent className="flex h-full flex-col">
          <h3 className="font-display text-lg font-bold text-text-primary">Informasi kunjungan</h3>

          <dl className="mt-4 flex-1 space-y-4 text-sm">
            <div className="flex gap-3">
              <dt className="shrink-0">
                <MapPin className="h-5 w-5 text-text-muted" aria-hidden="true" />
                <span className="sr-only">Alamat</span>
              </dt>
              <dd className="text-text-secondary">
                <address className="not-italic">
                  {site.contact.address.street}
                  <br />
                  {site.contact.address.locality}, {site.contact.address.region}{' '}
                  {site.contact.address.postalCode}
                </address>
                <p className="mt-1 text-xs text-text-muted">
                  Titik peta bersifat perkiraan kawasan.
                </p>
              </dd>
            </div>

            <div className="flex gap-3">
              <dt className="shrink-0">
                <Phone className="h-5 w-5 text-text-muted" aria-hidden="true" />
                <span className="sr-only">Telepon</span>
              </dt>
              <dd>
                <a
                  href={`tel:${site.contact.phone.replace(/[^\d+]/g, '')}`}
                  className="inline-flex min-h-touch items-center rounded-md text-text-accent hover:underline"
                >
                  {site.contact.phone}
                </a>
              </dd>
            </div>

            <div className="flex gap-3">
              <dt className="shrink-0">
                <Mail className="h-5 w-5 text-text-muted" aria-hidden="true" />
                <span className="sr-only">Pos-el</span>
              </dt>
              <dd>
                <a
                  href={`mailto:${site.contact.email}`}
                  className="inline-flex min-h-touch items-center rounded-md text-text-accent hover:underline"
                >
                  {site.contact.email}
                </a>
              </dd>
            </div>

            <div className="flex gap-3">
              <dt className="shrink-0">
                <Clock className="h-5 w-5 text-text-muted" aria-hidden="true" />
                <span className="sr-only">Jam layanan</span>
              </dt>
              <dd className="text-text-secondary">
                Senin – Kamis 08.00 – 16.00 WIB
                <br />
                Jumat 08.00 – 16.30 WIB
                <br />
                Sabtu & Minggu tutup
              </dd>
            </div>
          </dl>

          <ButtonLink href="/kontak" variant="outline" className="mt-6 w-full">
            Hubungi sekretariat
          </ButtonLink>
        </CardContent>
      </Card>
    </div>
  </Section>
);
