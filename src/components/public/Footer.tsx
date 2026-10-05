import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUp, Clock, Facebook, Instagram, LucideIcon, Mail, MapPin, Phone, Youtube } from 'lucide-react';
import { site } from '@/lib/site';
import { TreeLine } from '@/components/illustrations/Scenes';

const groups: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Jelajahi',
    links: [
      { label: 'Tentang Kwarcab', href: '/tentang' },
      { label: 'Golongan', href: '/golongan' },
      { label: 'Struktur Organisasi', href: '/struktur-organisasi' },
      { label: 'Berita', href: '/berita' },
      { label: 'Agenda Kegiatan', href: '/agenda' },
      { label: 'Galeri', href: '/galeri' },
      { label: 'Prestasi', href: '/prestasi' },
    ],
  },
  {
    title: 'Layanan',
    links: [
      { label: 'Cara Bergabung', href: '/bergabung' },
      { label: 'Wilayah & Gudep', href: '/wilayah' },
      { label: 'Pusat Dokumen', href: '/dokumen' },
      { label: 'Cari di situs', href: '/cari' },
      { label: 'Masuk Portal', href: '/masuk' },
      { label: 'Kontak', href: '/kontak' },
    ],
  },
];

const policyLinks = [
  { label: 'Kebijakan Privasi', href: '/kebijakan-privasi' },
  { label: 'Aksesibilitas', href: '/aksesibilitas' },
];

const socialIcons: Record<string, LucideIcon> = { Instagram, Facebook, YouTube: Youtube };

const linkClass = 'inline-flex min-h-touch items-center rounded-md text-text-inverse-muted transition-colors hover:text-text-inverse';

export const Footer: React.FC = () => {
  const { address } = site.contact;
  const social = site.social.filter((s) => s.url);

  return (
    <footer className="mt-auto">
      {/* Hutan sebagai tepi: isi halaman "berakhir" di batas pepohonan. */}
      <TreeLine className="text-surface-inverse" seed={21} />
      <div className="on-inverse topo-inverse bg-surface-inverse text-text-inverse-muted">
        <div className="civic-container pb-10 pt-10 sm:pt-14">
          <div className="flex flex-col gap-6 border-b border-border-inverse-subtle pb-10 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow text-text-inverse-muted">Semboyan Gerakan Pramuka</p>
              <p className="mt-3 font-display text-display-md font-semibold text-text-inverse">Satyaku Kudarmakan, Darmaku Kubaktikan</p>
            </div>
            <Link
              href="/bergabung"
              className="inline-flex min-h-touch shrink-0 items-center gap-2 self-start rounded-pill bg-surface-base px-6 font-semibold text-action-secondary-text transition-colors hover:bg-action-secondary md:self-auto"
            >
              Mulai bergabung
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-12">
            <div className="md:col-span-4">
              <div className="flex items-center gap-3">
                <Image src={site.mark} alt="" width={48} height={48} className="h-12 w-12" />
                <div className="leading-tight">
                  <p className="font-display text-lg font-semibold text-text-inverse">Rumah Pramuka</p>
                  <p className="text-sm">Kwartir Cabang Indramayu</p>
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
              {social.length > 0 && (
                <ul className="mt-6 flex gap-2" aria-label="Media sosial">
                  {social.map((s) => {
                    const Icon = socialIcons[s.label] ?? Mail;
                    return (
                      <li key={s.label}>
                        <a
                          href={s.url}
                          rel="noopener noreferrer"
                          target="_blank"
                          className="inline-flex h-11 w-11 items-center justify-center rounded-pill border border-border-inverse text-text-inverse-muted transition-colors hover:border-border-inverse-hover hover:text-text-inverse"
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

            <nav aria-label="Navigasi footer" className="grid grid-cols-2 gap-8 md:col-span-5">
              {groups.map((g) => (
                <div key={g.title}>
                  <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-text-inverse">{g.title}</h2>
                  <ul className="mt-3">
                    {g.links.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href} className={linkClass}>
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>

            <div className="md:col-span-3">
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-text-inverse">Hubungi kami</h2>
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
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-border-inverse-subtle pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p>
              &copy; {new Date().getFullYear()} {site.organization}
            </p>
            <ul className="flex flex-wrap items-center gap-x-5">
              {policyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a href="#atas" className={linkClass}>
                  <ArrowUp className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Kembali ke atas
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};
