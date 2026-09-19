import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Mail, Phone } from 'lucide-react';
import { site } from '@/lib/site';

const quickLinks = [
  { label: 'Tentang Kami', href: '/tentang' },
  { label: 'Struktur Organisasi', href: '/struktur-organisasi' },
  { label: 'Berita Terkini', href: '/berita' },
  { label: 'Agenda Kegiatan', href: '/agenda' },
];

const infoLinks = [
  { label: 'Dokumen Resmi', href: '/dokumen' },
  { label: 'Prestasi', href: '/prestasi' },
  { label: 'Kebijakan Privasi', href: '/kebijakan-privasi' },
  { label: 'Pernyataan Aksesibilitas', href: '/aksesibilitas' },
];

const footerLinkClass =
  'inline-flex items-center min-h-touch text-neutral-300 hover:text-white rounded-md';

export const Footer: React.FC = () => (
  <footer className="on-inverse bg-surface-inverse text-neutral-300">
    <div className="civic-container py-12">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Image
              src={site.logo}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded bg-white p-1"
            />
            <span className="font-display font-bold text-white">{site.shortName}</span>
          </div>
          <p className="text-sm leading-relaxed max-w-prose">{site.description}</p>
          <address className="not-italic text-sm mt-4 leading-relaxed">
            {site.contact.address.street}
            <br />
            {site.contact.address.locality}, {site.contact.address.region}{' '}
            {site.contact.address.postalCode}
          </address>
        </div>

        <nav aria-label="Navigasi footer — tautan cepat">
          <h2 className="text-white font-semibold mb-2">Tautan Cepat</h2>
          <ul>
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={footerLinkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Navigasi footer — informasi">
          <h2 className="text-white font-semibold mb-2">Informasi</h2>
          <ul>
            {infoLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={footerLinkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-white font-semibold mb-2">Hubungi Kami</h2>
          <ul className="text-sm">
            <li>
              <a href={`tel:${site.contact.phone.replace(/[^\d+]/g, '')}`} className={footerLinkClass}>
                <Phone className="h-4 w-4 mr-2 shrink-0" aria-hidden="true" />
                {site.contact.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.contact.email}`} className={footerLinkClass}>
                <Mail className="h-4 w-4 mr-2 shrink-0" aria-hidden="true" />
                {site.contact.email}
              </a>
            </li>
            <li className="flex items-start gap-2 min-h-touch pt-2">
              <Clock className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>Senin – Jumat, 08.00 – 16.00 WIB</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-10 pt-6 border-t border-neutral-700 text-sm">
        <p>
          &copy; {new Date().getFullYear()} {site.organization}. Hak cipta dilindungi.
        </p>
      </div>
    </div>
  </footer>
);
