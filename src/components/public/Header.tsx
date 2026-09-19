'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { LanguageSelector } from '../ui/LanguageSelector';

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

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  const linkClass = (href: string, extra: string) =>
    `${extra} font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-700 rounded ${
      isActive(href) ? 'text-green-800 underline underline-offset-8 decoration-2' : 'text-neutral-700 hover:text-green-800'
    }`;

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link
              href="/"
              className="flex-shrink-0 flex items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-700 rounded"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="h-10 w-auto sm:h-12" src="/brand/logo.svg" alt="" width={120} height={36} />
              <div className="ml-3 flex flex-col justify-center">
                <span className="text-sm font-bold text-neutral-900 leading-tight">KWARTIR CABANG</span>
                <span className="text-xs text-neutral-700 leading-tight">GERAKAN PRAMUKA INDRAMAYU</span>
              </div>
            </Link>
          </div>

          <nav aria-label="Navigasi utama" className="hidden lg:flex space-x-5 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={linkClass(link.href, 'px-1 py-3 text-sm inline-flex items-center min-h-[44px]')}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center">
            <LanguageSelector />
          </div>

          <div className="flex items-center lg:hidden">
            <button
              ref={toggleRef}
              type="button"
              className="inline-flex items-center justify-center rounded-md text-neutral-700 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-700 min-h-[44px] min-w-[44px]"
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
      </div>

      {isMobileMenuOpen && (
        <nav
          id="mobile-menu"
          aria-label="Navigasi utama (ponsel)"
          className="lg:hidden absolute w-full bg-white border-b border-neutral-200 z-50 shadow-md max-h-[calc(100vh-5rem)] overflow-y-auto"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={linkClass(link.href, 'flex items-center px-3 min-h-[44px] text-base hover:bg-neutral-50')}
              >
                {link.label}
              </Link>
            ))}
            <div className="px-3 py-2">
              <LanguageSelector />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
};
