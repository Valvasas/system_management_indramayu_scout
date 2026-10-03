'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, LifeBuoy, LogOut, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardRole, DashboardUser } from '@/types/dashboard';
import { dashboardNav, roleTitle } from './nav';

const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

export interface DashboardShellProps {
  portal: DashboardRole;
  user: DashboardUser;
  children: React.ReactNode;
}

/**
 * Kerangka dasbor: sidebar tetap di desktop, drawer di ponsel.
 * Satu pola untuk semua peran supaya pengguna yang berpindah peran tidak belajar ulang.
 */
export const DashboardShell: React.FC<DashboardShellProps> = ({ portal, user, children }) => {
  const nav = dashboardNav[portal];
  const [open, setOpen] = useState(false);
  const [hash, setHash] = useState(nav[0].href);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setHash(window.location.hash || nav[0].href);
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, [nav]);

  const close = useCallback((returnFocus = false) => {
    setOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  }, []);

  // Escape menutup, Tab terperangkap di drawer, scroll body terkunci.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    drawerRef.current?.querySelector<HTMLElement>('a[href]')?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return close(true);
      if (e.key !== 'Tab' || !drawerRef.current) return;
      const f = drawerRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      if (f.length === 0) return;
      const first = f[0];
      const last = f[f.length - 1];
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

  const navList = (onNavigate?: () => void) => (
    <nav aria-label={`Menu ${roleTitle[portal]}`} className="flex flex-1 flex-col px-3 py-4">
      <ul className="space-y-1">
        {nav.map((item) => {
          const active = hash === item.href;
          return (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? 'location' : undefined}
                className={cn(
                  'flex min-h-12 items-center gap-3 rounded-lg px-3 text-base font-medium transition-colors',
                  active
                    ? 'bg-surface-brand-tint text-text-accent'
                    : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary',
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>

      <ul className="mt-auto space-y-1 border-t border-border-subtle pt-4">
        <li>
          <Link
            href="/kontak"
            className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-base text-text-secondary hover:bg-surface-subtle hover:text-text-primary"
          >
            <LifeBuoy className="h-5 w-5 shrink-0" aria-hidden="true" />
            Bantuan
          </Link>
        </li>
        <li>
          <Link
            href="/"
            className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-base text-text-secondary hover:bg-surface-subtle hover:text-text-primary"
          >
            <ExternalLink className="h-5 w-5 shrink-0" aria-hidden="true" />
            Situs publik
          </Link>
        </li>
      </ul>
    </nav>
  );

  const brand = (
    <Link href="/" className="flex items-center gap-3 rounded-lg" aria-label="Kwarcab Indramayu — situs publik">
      <Image src="/brand/logo.svg" alt="" width={36} height={36} className="h-9 w-9" />
      <span className="leading-tight">
        <span className="block font-display text-sm font-bold text-text-primary">Kwarcab Indramayu</span>
        <span className="block text-xs text-text-secondary">{roleTitle[portal]}</span>
      </span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-surface-canvas">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border-subtle bg-surface-base lg:flex">
        <div className="flex h-16 items-center border-b border-border-subtle px-5">{brand}</div>
        {navList()}
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-64">
        {/* Bilah atas */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border-subtle bg-surface-base px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="dashboard-drawer"
              className="inline-flex min-h-touch items-center gap-2 rounded-lg border border-border-strong px-3 text-sm font-medium text-text-primary hover:bg-surface-subtle lg:hidden"
            >
              {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
              Menu
            </button>
            <div className="hidden sm:block lg:hidden">{brand}</div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-semibold text-text-primary">{user.name}</p>
              <p className="text-xs text-text-secondary">{user.roleLabel}</p>
            </div>
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full bg-tag-surface font-display text-sm font-bold text-tag-text"
              aria-hidden="true"
            >
              {initials(user.name)}
            </span>
            <Link
              href="/masuk"
              className="inline-flex min-h-touch items-center gap-2 rounded-lg px-3 text-sm font-medium text-text-secondary hover:bg-surface-subtle hover:text-text-primary"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Keluar
            </Link>
          </div>
        </header>

        <main id="main-content" className="flex-1 px-4 py-8 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      {/* Drawer ponsel/tablet */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-surface-scrim lg:hidden" onClick={() => close(true)} aria-hidden="true" />
          <div
            id="dashboard-drawer"
            ref={drawerRef}
            className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-surface-base shadow-dialog lg:hidden"
          >
            <div className="flex h-16 items-center justify-between border-b border-border-subtle px-4">
              {brand}
              <button
                type="button"
                onClick={() => close(true)}
                className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-lg text-text-secondary hover:bg-surface-subtle"
              >
                <X className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">Tutup menu</span>
              </button>
            </div>
            {navList(() => close())}
          </div>
        </>
      )}
    </div>
  );
};
