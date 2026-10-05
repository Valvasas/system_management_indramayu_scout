'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Award,
  CalendarDays,
  Compass,
  FileText,
  Home,
  Images,
  LogIn,
  Map,
  Menu,
  Newspaper,
  Phone,
  Search,
  Sprout,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { site } from '@/lib/site';
import { buttonStyles } from '@/components/ui/Button';
import { TreeLine } from '@/components/illustrations/Scenes';

type NavLink = { label: string; href: string; icon: LucideIcon; /** Rute lain yang ikut menandai menu ini aktif. */ also?: string[] };

/** Menu desktop: enam tujuan yang paling sering dicari pengunjung. */
const primaryLinks: NavLink[] = [
  { label: 'Tentang', href: '/tentang', icon: Compass, also: ['/struktur-organisasi', '/golongan'] },
  { label: 'Berita', href: '/berita', icon: Newspaper },
  { label: 'Agenda', href: '/agenda', icon: CalendarDays },
  { label: 'Galeri', href: '/galeri', icon: Images },
  { label: 'Dokumen', href: '/dokumen', icon: FileText },
  { label: 'Wilayah', href: '/wilayah', icon: Map },
];

/** Menu ponsel: dikelompokkan supaya mudah dipindai dengan ibu jari. */
const mobileGroups: { title: string; links: NavLink[] }[] = [
  {
    title: 'Kenali kami',
    links: [
      { label: 'Beranda', href: '/', icon: Home },
      { label: 'Tentang Kwarcab', href: '/tentang', icon: Compass },
      { label: 'Golongan', href: '/golongan', icon: Sprout },
      { label: 'Struktur Organisasi', href: '/struktur-organisasi', icon: Users },
      { label: 'Wilayah & Gudep', href: '/wilayah', icon: Map },
    ],
  },
  {
    title: 'Kabar & kegiatan',
    links: [
      { label: 'Berita', href: '/berita', icon: Newspaper },
      { label: 'Agenda', href: '/agenda', icon: CalendarDays },
      { label: 'Galeri', href: '/galeri', icon: Images },
      { label: 'Prestasi', href: '/prestasi', icon: Award },
    ],
  },
  {
    title: 'Layanan',
    links: [
      { label: 'Pusat Dokumen', href: '/dokumen', icon: FileText },
      { label: 'Cara Bergabung', href: '/bergabung', icon: Sprout },
      { label: 'Kontak', href: '/kontak', icon: Phone },
    ],
  },
];

export const Header: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const matches = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`));
  const isActive = (link: NavLink) => matches(link.href) || (link.also ?? []).some(matches);

  const close = useCallback((returnFocus = false) => {
    setOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  }, []);

  useEffect(() => close(), [pathname, close]);

  // Bayangan halus begitu halaman digulir: memisahkan header dari isi tanpa garis tebal.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Escape menutup, Tab terperangkap di dalam drawer, scroll body terkunci, fokus awal di pencarian.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    drawerRef.current?.querySelector<HTMLElement>('input, a[href], button')?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close(true);
        return;
      }
      if (e.key !== 'Tab' || !drawerRef.current) return;
      const focusables = drawerRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input');
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
  }, [open, close]);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b bg-surface-base transition-shadow duration-300',
        scrolled ? 'border-border-subtle shadow-md' : 'border-transparent',
      )}
    >
      <div className="civic-container">
        <div className="flex h-16 items-center justify-between gap-4 sm:h-[4.5rem]">
          <Link href="/" className="flex items-center gap-3 rounded-lg py-1.5" aria-label={`${site.name} — kembali ke beranda`}>
            <Image src={site.mark} alt="" width={40} height={40} priority className="h-10 w-10" />
            <span className="flex flex-col leading-tight">
              <span className="font-display text-lg font-semibold text-text-primary">Rumah Pramuka</span>
              <span className="text-xs font-medium text-text-secondary">Kwarcab Indramayu</span>
            </span>
          </Link>

          <nav aria-label="Navigasi utama" className="hidden lg:block">
            <ul className="flex items-center gap-0.5">
              {primaryLinks.map((link) => {
                const active = isActive(link);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'relative inline-flex min-h-touch items-center rounded-pill px-3.5 text-[0.95rem] font-medium transition-colors xl:px-4',
                        active ? 'bg-surface-meadow text-text-accent' : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary',
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/cari"
              aria-label="Cari di situs"
              className="inline-flex h-11 w-11 items-center justify-center rounded-pill text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link href="/masuk" className={buttonStyles('ghost', 'sm', 'hidden md:inline-flex')}>
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Masuk
            </Link>
            <Link href="/bergabung" className={buttonStyles('secondary', 'sm', 'hidden sm:inline-flex')}>
              <Sprout className="h-4 w-4" aria-hidden="true" />
              Bergabung
            </Link>
            <button
              ref={toggleRef}
              type="button"
              className="inline-flex min-h-touch items-center gap-2 rounded-pill border border-border-strong px-4 text-sm font-semibold text-text-primary hover:bg-surface-subtle lg:hidden"
              aria-controls="mobile-menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
              {/* Label teks terlihat: lebih mudah dikenali pengguna senior daripada ikon saja. */}
              {open ? 'Tutup' : 'Menu'}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 top-16 z-40 bg-surface-scrim sm:top-[4.5rem] lg:hidden" onClick={() => close(true)} aria-hidden="true" />
          <div
            ref={drawerRef}
            className="fixed inset-x-0 bottom-0 top-16 z-50 flex flex-col overflow-y-auto bg-surface-canvas animate-rise sm:top-[4.5rem] lg:hidden"
          >
            <nav id="mobile-menu" aria-label="Navigasi utama (ponsel)" className="civic-container flex-1 py-5">
              <form action="/cari" role="search" className="relative">
                <label htmlFor="menu-search" className="sr-only">
                  Cari berita, agenda, atau dokumen
                </label>
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" aria-hidden="true" />
                <input
                  id="menu-search"
                  name="q"
                  type="search"
                  placeholder="Cari berita, agenda, dokumen…"
                  className="h-12 w-full rounded-pill border border-border-strong bg-surface-base pl-12 pr-4 text-base text-text-primary placeholder:text-text-muted"
                />
              </form>

              {mobileGroups.map((group) => (
                <div key={group.title} className="mt-6">
                  <p className="eyebrow px-1">{group.title}</p>
                  <ul className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {group.links.map((link) => {
                      const Icon = link.icon;
                      const active = isActive(link);
                      return (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                              'flex min-h-[3.25rem] items-center gap-3 rounded-xl px-3 text-base font-medium transition-colors',
                              active ? 'bg-surface-meadow text-text-accent' : 'text-text-primary hover:bg-surface-base',
                            )}
                          >
                            <span className={cn('flex h-9 w-9 items-center justify-center rounded-pill', active ? 'bg-surface-base' : 'bg-surface-sand')}>
                              <Icon className="h-[1.1rem] w-[1.1rem]" aria-hidden="true" />
                            </span>
                            {link.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <Link href="/bergabung" className={buttonStyles('accent', 'lg', 'w-full')}>
                  <Sprout className="h-5 w-5" aria-hidden="true" />
                  Cara bergabung
                </Link>
                <Link href="/masuk" className={buttonStyles('outline', 'lg', 'w-full')}>
                  <LogIn className="h-5 w-5" aria-hidden="true" />
                  Masuk portal
                </Link>
              </div>
            </nav>
            <TreeLine className="mt-4 shrink-0 text-surface-forest" seed={12} />
          </div>
        </>
      )}
    </header>
  );
};
