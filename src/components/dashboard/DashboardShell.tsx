'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  CalendarDays,
  ExternalLink,
  Globe,
  Home,
  Inbox,
  KeyRound,
  ListChecks,
  LogOut,
  LucideIcon,
  Map,
  Megaphone,
  Menu,
  Settings,
  ShieldCheck,
  User,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutAction } from '@/features/auth/actions';
import type { NavGroup, NavIcon } from './nav';

const ICONS: Record<NavIcon, LucideIcon> = {
  home: Home,
  users: Users,
  map: Map,
  building: Building2,
  megaphone: Megaphone,
  inbox: Inbox,
  globe: Globe,
  settings: Settings,
  shield: ShieldCheck,
  list: ListChecks,
  calendar: CalendarDays,
  user: User,
};

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

export interface DashboardShellProps {
  user: { name: string; roleLabel: string; scopeLabel: string | null };
  nav: NavGroup[];
  children: React.ReactNode;
}

/**
 * Kerangka portal: sidebar tetap (desktop) / drawer (ponsel), bilah atas berisi
 * identitas & cakupan pengguna. Satu pola untuk semua peran.
 */
export const DashboardShell: React.FC<DashboardShellProps> = ({ user, nav, children }) => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => (href === '/dashboard' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  const close = useCallback((returnFocus = false) => {
    setOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  }, []);

  useEffect(() => close(), [pathname, close]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    drawerRef.current?.querySelector<HTMLElement>('a[href]')?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return close(true);
      if (e.key !== 'Tab' || !drawerRef.current) return;
      const f = drawerRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      if (!f.length) return;
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

  const linkClass = (active: boolean) =>
    cn(
      'flex min-h-12 items-center gap-3 rounded-lg px-3 text-base font-medium transition-colors',
      active ? 'bg-surface-brand-tint text-text-accent' : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary',
    );

  const navList = (
    <nav aria-label="Menu portal" className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
      <div className="space-y-5">
        {nav.map((group, gi) => (
          <div key={group.title ?? gi}>
            {group.title && (
              <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-text-muted">{group.title}</p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = ICONS[item.icon];
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link href={item.href} aria-current={active ? 'page' : undefined} className={linkClass(active)}>
                      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge ? (
                        <span className="rounded-pill bg-action-primary px-2 py-0.5 text-xs font-bold text-text-on-brand">
                          {item.badge}
                          <span className="sr-only"> menunggu</span>
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <ul className="mt-6 space-y-1 border-t border-border-subtle pt-4">
        <li>
          <Link href="/dashboard/akun" aria-current={isActive('/dashboard/akun') ? 'page' : undefined} className={linkClass(isActive('/dashboard/akun'))}>
            <KeyRound className="h-5 w-5 shrink-0" aria-hidden="true" />
            Akun saya
          </Link>
        </li>
        <li>
          <Link href="/" className={linkClass(false)}>
            <ExternalLink className="h-5 w-5 shrink-0" aria-hidden="true" />
            Lihat situs publik
          </Link>
        </li>
      </ul>
    </nav>
  );

  const brand = (
    <Link href="/dashboard" className="flex items-center gap-3 rounded-lg" aria-label="Portal Kwarcab Indramayu — ringkasan">
      <Image src="/brand/logo.svg" alt="" width={36} height={36} className="h-9 w-9" />
      <span className="leading-tight">
        <span className="block font-display text-sm font-bold text-text-primary">Kwarcab Indramayu</span>
        <span className="block text-xs text-text-secondary">Portal Pengurus</span>
      </span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-surface-canvas">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border-subtle bg-surface-base lg:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-border-subtle px-5">{brand}</div>
        {navList}
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border-subtle bg-surface-base px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="portal-drawer"
              className="inline-flex min-h-touch items-center gap-2 rounded-lg border border-border-strong px-3 text-sm font-medium text-text-primary hover:bg-surface-subtle lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
              Menu
            </button>
            <div className="hidden sm:block lg:hidden">{brand}</div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-semibold text-text-primary">{user.name}</p>
              <p className="text-xs text-text-secondary">
                {user.roleLabel}
                {user.scopeLabel ? ` · ${user.scopeLabel}` : ''}
              </p>
            </div>
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full bg-tag-surface font-display text-sm font-bold text-tag-text"
              aria-hidden="true"
            >
              {initials(user.name)}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex min-h-touch items-center gap-2 rounded-lg px-3 text-sm font-medium text-text-secondary hover:bg-surface-subtle hover:text-text-primary"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Keluar
              </button>
            </form>
          </div>
        </header>

        <main id="main-content" className="flex-1 px-4 py-8 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-surface-scrim lg:hidden" onClick={() => close(true)} aria-hidden="true" />
          <div
            id="portal-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu portal"
            className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-surface-base shadow-dialog lg:hidden"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border-subtle px-4">
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
            {navList}
          </div>
        </>
      )}
    </div>
  );
};
