'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogIn, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { site } from '@/lib/site';
import { buttonStyles } from '@/components/ui/Button';

type NavLink = { label: string; href: string; /** Rute lain yang ikut menandai menu ini aktif. */ also?: string[] };

/** Menu utama sengaja dibatasi empat butir: tugas yang paling sering dicari pengunjung. */
const primaryLinks: NavLink[] = [
  { label: 'Profil', href: '/tentang', also: ['/struktur-organisasi'] },
  { label: 'Berita', href: '/berita' },
  { label: 'Dokumen', href: '/dokumen' },
  { label: 'Kontak', href: '/kontak' },
];

/** Halaman sekunder: tampil di menu ponsel dan footer, tidak menyesaki navbar desktop. */
const secondaryLinks: NavLink[] = [
  { label: 'Agenda Kegiatan', href: '/agenda' },
  { label: 'Galeri', href: '/galeri' },
  { label: 'Prestasi', href: '/prestasi' },
  { label: 'Struktur Organisasi', href: '/struktur-organisasi' },
];

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const matches = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const isActive = (link: NavLink) => matches(link.href) || (link.also ?? []).some(matches);

  const close = useCallback((returnFocus = false) => {
    setIsMobileMenuOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  }, []);

  useEffect(() => {
    close();
  }, [pathname, close]);

  // Escape menutup, Tab terperangkap di dalam drawer, scroll body terkunci.
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close(true);
        return;
      }
      if (e.key !== 'Tab' || !drawerRef.current) return;
      const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isMobileMenuOpen, close]);

  const linkClass = (link: NavLink, extra: string) =>
    cn(
      extra,
      'font-medium rounded-lg transition-colors',
      isActive(link)
        ? 'text-text-accent bg-surface-brand-tint'
        : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle',
    );

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface-base">
      <div className="civic-container">
        <div className="flex h-20 items-center justify-between gap-6">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg py-2"
            aria-label={`${site.shortName} — kembali ke beranda`}
          >
            <Image
              src="/brand/logo.svg"
              alt=""
              width={44}
              height={44}
              priority
              className="h-10 w-10 sm:h-11 sm:w-11"
            />
            <span className="flex flex-col leading-tight">
              <span className="font-display text-base font-bold text-text-primary">
                Kwarcab Indramayu
              </span>
              <span className="text-xs text-text-secondary">Gerakan Pramuka</span>
            </span>
          </Link>

          <nav aria-label="Navigasi utama" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {primaryLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive(link) ? 'page' : undefined}
                    className={linkClass(link, 'inline-flex min-h-touch items-center px-4 text-base')}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/masuk" className={buttonStyles('primary', 'md', 'hidden sm:inline-flex')}>
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Masuk Portal
            </Link>

            <button
              ref={toggleRef}
              type="button"
              className="inline-flex min-h-touch items-center gap-2 rounded-lg border border-border-strong px-3 text-sm font-medium text-text-primary hover:bg-surface-subtle md:hidden"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((open) => !open)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
              {/* Label teks terlihat: lebih mudah dikenali pengguna senior daripada ikon saja. */}
              {isMobileMenuOpen ? 'Tutup' : 'Menu'}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 top-20 z-40 bg-surface-scrim md:hidden"
            onClick={() => close(true)}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            className="absolute inset-x-0 z-50 max-h-[calc(100vh-5rem)] overflow-y-auto border-b border-border-subtle bg-surface-base shadow-md md:hidden"
          >
            <nav id="mobile-menu" aria-label="Navigasi utama (ponsel)" className="civic-container py-4">
              <ul className="space-y-1">
                {primaryLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={isActive(link) ? 'page' : undefined}
                      className={linkClass(link, 'flex min-h-touch items-center px-3 text-lg')}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <p className="mt-5 px-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Lainnya
              </p>
              <ul className="mt-1 space-y-1">
                {secondaryLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={matches(link.href) ? 'page' : undefined}
                      className={linkClass(link, 'flex min-h-touch items-center px-3 text-base')}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <Link href="/masuk" className={buttonStyles('primary', 'lg', 'mt-5 w-full sm:hidden')}>
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Masuk Portal
              </Link>
            </nav>
          </div>
        </>
      )}
    </header>
  );
};
