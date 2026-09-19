'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { site } from '@/lib/site';

const navLinks = [
  { label: 'Beranda', href: '/' },
  { label: 'Tentang', href: '/tentang' },
  { label: 'Struktur', href: '/struktur-organisasi' },
  { label: 'Berita', href: '/berita' },
  { label: 'Agenda', href: '/agenda' },
  { label: 'Galeri', href: '/galeri' },
  { label: 'Prestasi', href: '/prestasi' },
  { label: 'Dokumen', href: '/dokumen' },
  { label: 'Kontak', href: '/kontak' },
];

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

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

  const linkClass = (href: string, extra: string) =>
    cn(
      extra,
      'font-medium rounded-md transition-colors',
      isActive(href)
        ? 'text-text-accent bg-action-secondary'
        : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle',
    );

  return (
    <header className="bg-surface-base border-b border-border-subtle sticky top-0 z-40">
      <div className="civic-container">
        <div className="flex items-center justify-between gap-4 h-20">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-md py-2"
            aria-label={`${site.name} — kembali ke beranda`}
          >
            <Image
              src="/brand/logo.svg"
              alt=""
              width={48}
              height={48}
              priority
              className="h-10 w-10 sm:h-12 sm:w-12"
            />
            <span className="flex flex-col justify-center leading-tight">
              <span className="text-sm font-bold text-text-primary">KWARTIR CABANG</span>
              <span className="text-xs text-text-secondary">GERAKAN PRAMUKA INDRAMAYU</span>
            </span>
          </Link>

          <nav aria-label="Navigasi utama" className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={linkClass(link.href, 'inline-flex items-center min-h-touch px-3 text-sm')}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <button
            ref={toggleRef}
            type="button"
            className="lg:hidden inline-flex items-center justify-center rounded-md min-h-touch min-w-touch text-text-secondary hover:bg-surface-subtle hover:text-text-primary"
            aria-controls="mobile-menu"
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            <span className="sr-only">{isMobileMenuOpen ? 'Tutup menu utama' : 'Buka menu utama'}</span>
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 top-20 z-40 bg-surface-scrim"
            onClick={() => close(true)}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            className="lg:hidden absolute inset-x-0 z-50 bg-surface-base border-b border-border-subtle shadow-md max-h-[calc(100vh-5rem)] overflow-y-auto"
          >
            <nav id="mobile-menu" aria-label="Navigasi utama (ponsel)" className="civic-container py-3">
              <ul className="space-y-1">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={isActive(link.href) ? 'page' : undefined}
                      className={linkClass(link.href, 'flex items-center min-h-touch px-3 text-base')}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </>
      )}
    </header>
  );
};
