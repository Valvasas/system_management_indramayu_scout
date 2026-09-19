'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { LanguageSelector } from '../ui/LanguageSelector';
import Link from 'next/link';

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center focus:outline-none focus:ring-2 focus:ring-green-600 rounded">
              <span className="sr-only">Kwarcab Indramayu</span>
              <img className="h-10 w-auto sm:h-12" src="/logo-pramuka.png" alt="Logo Pramuka" />
              <div className="ml-3 flex flex-col justify-center">
                <span className="text-sm font-bold text-gray-900 leading-tight">KWARTIR CABANG</span>
                <span className="text-xs text-gray-600 leading-tight">GERAKAN PRAMUKA INDRAMAYU</span>
              </div>
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-6 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-gray-700 hover:text-green-600 px-1 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-600 rounded"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <LanguageSelector />
            <Link href="/masuk">
              <Button variant="primary">Masuk</Button>
            </Link>
          </div>

          <div className="flex items-center md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-600 min-h-[44px] min-w-[44px]"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Buka menu utama</span>
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute w-full bg-white border-b border-gray-200 z-50 shadow-lg" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="px-3 py-2">
              <LanguageSelector />
            </div>
            <div className="px-3 py-2 mt-2">
              <Link href="/masuk" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full">Masuk</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
