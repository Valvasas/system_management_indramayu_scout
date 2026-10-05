'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeftRight,
  Building2,
  CalendarDays,
  ClipboardList,
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
  PenLine,
  Settings,
  ShieldCheck,
  User,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutAction } from '@/features/auth/actions';
import { TreeLine } from '@/components/illustrations/Scenes';
import type { NavGroup, NavIcon, NavItem } from './nav';

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
  swap: ArrowLeftRight,
  clipboard: ClipboardList,
  pen: PenLine,
  key: KeyRound,
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
  /** Nama portal di kepala sidebar: peserta tidak memakai "Portal Pengurus". */
  portalLabel?: string;
  nav: NavGroup[];
  children: React.ReactNode;
}

/**
 * Kerangka portal bertema hutan.
 * - Desktop: sidebar hutan gelap tetap di kiri.
 * - Ponsel: bilah navigasi BAWAH berisi menu terpenting (terjangkau ibu jari) + tombol Menu
 *   yang membuka laci berisi semua menu. Satu pola untuk semua peran.
 */
export const DashboardShell: React.FC<DashboardShellProps> = ({ user, nav, portalLabel = 'Portal Pengurus', children }) => {
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
    drawerRef.current?.querySelector<HTMLElement>('a[href], button')?.focus();
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

  // Menu bilah bawah ponsel: tiga tujuan pertama (Ringkasan + dua tugas utama peran) + Akun.
  const flat = nav.flatMap((g) => g.items);
  const quick: NavItem[] = [...flat.slice(0, 3), { href: '/dashboard/akun', label: 'Akun', icon: 'user' }];
  const hiddenBadges = flat.slice(3).reduce((n, i) => n + (i.badge ?? 0), 0);

  const linkClass = (active: boolean) =>
    cn(
      'flex min-h-12 items-center gap-3 rounded-xl px-3 text-[0.95rem] font-medium transition-colors',
      active ? 'bg-surface-base text-action-secondary-text shadow-sm' : 'text-text-inverse-muted hover:bg-surface-inverse hover:text-text-inverse',
    );

  const navList = (
    <nav aria-label="Menu portal" className="relative z-10 flex flex-1 flex-col overflow-y-auto px-3 py-5">
      <div className="space-y-6">
        {nav.map((group, gi) => (
          <div key={group.title ?? gi}>
            {group.title && <p className="mb-1.5 px-3 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-text-inverse-muted">{group.title}</p>}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = ICONS[item.icon];
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link href={item.href} aria-current={active ? 'page' : undefined} className={linkClass(active)}>
                      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge ? (
                        <span className="rounded-pill bg-action-accent px-2 py-0.5 text-xs font-bold tabular-nums text-text-on-brand">
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

      <ul className="mt-8 space-y-0.5 border-t border-border-inverse-subtle pt-4">
        <li>
          <Link href="/dashboard/akun" aria-current={isActive('/dashboard/akun') ? 'page' : undefined} className={linkClass(isActive('/dashboard/akun'))}>
            <UserCog className="h-5 w-5 shrink-0" aria-hidden="true" />
            Akun saya
          </Link>
        </li>
        <li>
          <Link href="/" className={linkClass(false)}>
            <ExternalLink className="h-5 w-5 shrink-0" aria-hidden="true" />
            Lihat situs publik
          </Link>
        </li>
        <li>
          <form action={logoutAction}>
            <button type="submit" className={cn(linkClass(false), 'w-full')}>
              <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
              Keluar
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );

  const brand = (
    <Link href="/dashboard" className="flex items-center gap-3 rounded-xl" aria-label="Portal Rumah Pramuka — ringkasan">
      <Image src="/brand/mark.svg" alt="" width={40} height={40} className="h-10 w-10" />
      <span className="leading-tight">
        <span className="block font-display text-base font-semibold text-text-inverse">Rumah Pramuka</span>
        <span className="block text-xs text-text-inverse-muted">{portalLabel}</span>
      </span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-surface-canvas">
      <aside className="on-inverse topo-inverse fixed inset-y-0 left-0 z-30 hidden w-[17rem] flex-col bg-surface-forest lg:flex">
        <div className="flex h-[4.5rem] shrink-0 items-center px-5">{brand}</div>
        {navList}
        <TreeLine className="pointer-events-none shrink-0 text-surface-inverse" seed={44} />
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-[17rem]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border-subtle bg-surface-base px-4 sm:h-[4.5rem] sm:px-6 lg:px-10">
          <div className="flex items-center gap-3 lg:hidden">
            <Image src="/brand/mark.svg" alt="" width={36} height={36} className="h-9 w-9" />
            <span className="leading-tight">
              <span className="block font-display text-sm font-semibold text-text-primary">Rumah Pramuka</span>
              <span className="block text-xs text-text-secondary">{portalLabel}</span>
            </span>
          </div>
          <p className="hidden text-sm text-text-secondary lg:block">
            {user.scopeLabel ? (
              <>
                Cakupan: <span className="font-semibold text-text-primary">{user.scopeLabel}</span>
              </>
            ) : (
              user.roleLabel
            )}
          </p>

          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-semibold text-text-primary">{user.name}</p>
              <p className="text-xs text-text-secondary">{user.roleLabel}</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-pill bg-surface-meadow font-display text-sm font-semibold text-action-secondary-text" aria-hidden="true">
              {initials(user.name)}
            </span>
            <form action={logoutAction} className="hidden lg:block">
              <button
                type="submit"
                className="inline-flex min-h-touch items-center gap-2 rounded-pill px-3 text-sm font-medium text-text-secondary hover:bg-surface-subtle hover:text-text-primary"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Keluar
              </button>
            </form>
          </div>
        </header>

        {/* pb besar di ponsel: konten tidak tertutup bilah navigasi bawah. */}
        <main id="main-content" className="flex-1 px-4 pb-28 pt-7 sm:px-6 lg:px-10 lg:pb-12 lg:pt-9">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      {/* Navigasi bawah ponsel */}
      <nav aria-label="Navigasi cepat" className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border-subtle bg-surface-base shadow-dialog lg:hidden">
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {quick.map((item) => {
            const Icon = ICONS[item.icon];
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn('relative flex min-h-[3.75rem] flex-col items-center justify-center gap-1 px-1 text-[0.7rem] font-semibold', active ? 'text-text-accent' : 'text-text-secondary')}
                >
                  <span className={cn('flex h-7 w-12 items-center justify-center rounded-pill transition-colors', active && 'bg-surface-meadow')}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="max-w-full truncate">{item.label}</span>
                  {item.badge ? (
                    <span className="absolute right-2 top-1.5 min-w-[1.25rem] rounded-pill bg-action-accent px-1 text-center text-[0.65rem] font-bold leading-5 text-text-on-brand">
                      {item.badge}
                      <span className="sr-only"> menunggu</span>
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-controls="portal-drawer"
              className="relative flex min-h-[3.75rem] w-full flex-col items-center justify-center gap-1 px-1 text-[0.7rem] font-semibold text-text-secondary"
            >
              <span className="flex h-7 w-12 items-center justify-center rounded-pill">
                <Menu className="h-5 w-5" aria-hidden="true" />
              </span>
              Menu
              {hiddenBadges > 0 && (
                <span className="absolute right-2 top-1.5 min-w-[1.25rem] rounded-pill bg-action-accent px-1 text-center text-[0.65rem] font-bold leading-5 text-text-on-brand">
                  {hiddenBadges}
                  <span className="sr-only"> menunggu di menu lain</span>
                </span>
              )}
            </button>
          </li>
        </ul>
      </nav>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-surface-scrim lg:hidden" onClick={() => close(true)} aria-hidden="true" />
          <div
            id="portal-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu portal"
            className="on-inverse topo-inverse fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col overflow-hidden rounded-t-3xl bg-surface-forest shadow-dialog animate-rise lg:hidden"
          >
            <div className="flex h-16 shrink-0 items-center justify-between px-4">
              {brand}
              <button
                type="button"
                onClick={() => close(true)}
                className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-pill text-text-inverse-muted hover:bg-surface-inverse hover:text-text-inverse"
              >
                <X className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">Tutup menu</span>
              </button>
            </div>
            <div className="px-5 pb-1 text-sm text-text-inverse-muted">
              <span className="font-semibold text-text-inverse">{user.name}</span> · {user.roleLabel}
              {user.scopeLabel ? ` · ${user.scopeLabel}` : ''}
            </div>
            {navList}
          </div>
        </>
      )}
    </div>
  );
};
