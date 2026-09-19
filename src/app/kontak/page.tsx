import type { Metadata } from 'next';
import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/Section';
import { ContactForm } from './ContactForm';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Kontak & Layanan Aspirasi',
  description:
    'Alamat sekretariat, saluran komunikasi resmi, dan formulir aspirasi Kwartir Cabang Gerakan Pramuka Indramayu.',
  alternates: { canonical: '/kontak' },
};

export default function KontakPage() {
  return (
    <div className="civic-container py-12">
      <PageHeader
        title="Kontak & layanan aspirasi"
        description="Sampaikan pertanyaan, usulan kegiatan, atau koordinasi kwartir ranting dan gugus depan kepada sekretariat kwarcab."
      />

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <section aria-labelledby="sekretariat-title" className="space-y-6">
          <h2 id="sekretariat-title" className="sr-only">
            Informasi sekretariat
          </h2>

          <Card>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-display text-lg font-bold text-text-primary">
                  Sekretariat kwarcab
                </h3>
                <div className="mt-3 flex gap-3 text-sm">
                  <MapPin className="h-5 w-5 shrink-0 text-text-muted" aria-hidden="true" />
                  <address className="not-italic leading-relaxed text-text-secondary">
                    <strong className="block text-text-primary">
                      Gedung {site.organization}
                    </strong>
                    {site.contact.address.street}
                    <br />
                    {site.contact.address.locality}, {site.contact.address.region}{' '}
                    {site.contact.address.postalCode}
                  </address>
                </div>
              </div>

              <div className="border-t border-border-subtle pt-5">
                <h3 className="font-semibold text-text-primary">Jam layanan</h3>
                <ul className="mt-2 space-y-1 text-sm text-text-secondary">
                  <li className="flex items-start gap-2">
                    <Clock className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      Senin – Kamis 08.00 – 16.00 WIB
                      <br />
                      Jumat 08.00 – 16.30 WIB (istirahat 11.30 – 13.00)
                      <br />
                      Sabtu & Minggu tutup
                    </span>
                  </li>
                </ul>
              </div>

              <div className="border-t border-border-subtle pt-5">
                <h3 className="font-semibold text-text-primary">Saluran resmi</h3>
                <ul className="mt-2 text-sm">
                  <li>
                    <a
                      href={`tel:${site.contact.phone.replace(/[^\d+]/g, '')}`}
                      className="inline-flex min-h-touch items-center gap-2 rounded-md text-text-accent hover:underline"
                    >
                      <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {site.contact.phone}
                    </a>
                  </li>
                  <li>
                    <a
                      href={`https://wa.me/${site.contact.whatsapp.replace(/[^\d]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-touch items-center gap-2 rounded-md text-text-accent hover:underline"
                    >
                      <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                      WhatsApp {site.contact.whatsapp}
                    </a>
                  </li>
                  <li>
                    <a
                      href={`mailto:${site.contact.email}`}
                      className="inline-flex min-h-touch items-center gap-2 rounded-md text-text-accent hover:underline"
                    >
                      <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {site.contact.email}
                    </a>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3 className="font-semibold text-text-primary">Peta lokasi</h3>
              <p className="mt-1 text-sm text-text-secondary">
                Peta interaktif sekretariat tersedia di beranda; untuk petunjuk arah gunakan
                layanan peta pilihan Anda.
              </p>
              <ButtonLink
                href="https://www.openstreetmap.org/search?query=Kwarcab%20Pramuka%20Indramayu"
                variant="outline"
                size="sm"
                target="_blank"
                className="mt-4"
              >
                Buka petunjuk arah
              </ButtonLink>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="form-title">
          <Card>
            <CardContent>
              <h2 id="form-title" className="font-display text-lg font-bold text-text-primary">
                Kirim pesan atau aspirasi
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Sekretariat menanggapi pada hari kerja. Untuk urusan mendesak, gunakan telepon.
              </p>
              <div className="mt-6">
                <ContactForm />
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
