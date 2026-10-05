import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Facebook, Instagram, LucideIcon, Mail, MapPin, Phone, Youtube } from 'lucide-react';
import { site } from '@/lib/site';

const siteLinks = [
  { label: 'Profil Kwarcab', href: '/tentang' },
  { label: 'Struktur Organisasi', href: '/struktur-organisasi' },
  { label: 'Berita', href: '/berita' },
  { label: 'Agenda Kegiatan', href: '/agenda' },
  { label: 'Galeri', href: '/galeri' },
  { label: 'Prestasi', href: '/prestasi' },
  { label: 'Pusat Dokumen', href: '/dokumen' },
  { label: 'Kontak', href: '/kontak' },
];

const policyLinks = [
  { label: 'Kebijakan Privasi', href: '/kebijakan-privasi' },
  { label: 'Aksesibilitas', href: '/aksesibilitas' },
];

const socialIcons: Record<string, LucideIcon> = {
  Instagram,
  Facebook,
  YouTube: Youtube,
};

const linkClass =
  'inline-flex min-h-touch items-center rounded-lg text-text-inverse-muted transition-colors hover:text-text-inverse';

export const Footer: React.FC = () => {
  const { address } = site.contact;
  const social = site.social.filter((s) => s.url);

  return (
    <footer className="on-inverse bg-surface-inverse text-text-inverse-muted">
      <div className="civic-container py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          {/* Identitas & alamat */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <Image
                src={site.logo}
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 rounded-lg bg-surface-base p-1"
              />
              <div className="leading-tight">
                <p className="font-display text-base font-bold text-text-inverse">Kwarcab Indramayu</p>
                <p className="text-sm">Gerakan Pramuka</p>
              </div>
            </div>
            <address className="mt-6 flex gap-3 not-italic leading-relaxed">
              <MapPin className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
              <span>
                {address.street}
                <br />
                {address.locality}, {address.region} {address.postalCode}
              </span>
            </address>
          </div>

          {/* Tautan situs */}
          <nav aria-label="Navigasi footer" className="md:col-span-4">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-text-inverse">
              Jelajahi
            </h2>
            <ul className="mt-3 grid grid-cols-2 gap-x-6">
              {siteLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Kontak & media sosial */}
          <div className="md:col-span-3">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-text-inverse">
              Hubungi Kami
            </h2>
            <ul className="mt-3">
              <li>
                <a href={`tel:${site.contact.phone.replace(/[^\d+]/g, '')}`} className={linkClass}>
                  <Phone className="mr-3 h-4 w-4 shrink-0" aria-hidden="true" />
                  {site.contact.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${site.contact.email}`} className={`${linkClass} break-all`}>
                  <Mail className="mr-3 h-4 w-4 shrink-0" aria-hidden="true" />
                  {site.contact.email}
                </a>
              </li>
              <li className="flex min-h-touch items-center">
                <Clock className="mr-3 h-4 w-4 shrink-0" aria-hidden="true" />
                {site.contact.officeHours}
              </li>
            </ul>

            {social.length > 0 && (
              <ul className="mt-4 flex gap-2" aria-label="Media sosial">
                {social.map((s) => {
                  const Icon = socialIcons[s.label] ?? Mail;
                  return (
                    <li key={s.label}>
                      <a
                        href={s.url}
                        rel="noopener noreferrer"
                        target="_blank"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border-inverse text-text-inverse-muted transition-colors hover:border-border-inverse-hover hover:text-text-inverse"
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                        <span className="sr-only">{s.label} (tab baru)</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-border-inverse-subtle pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {site.organization}
          </p>
          <ul className="flex gap-4">
            {policyLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
};
