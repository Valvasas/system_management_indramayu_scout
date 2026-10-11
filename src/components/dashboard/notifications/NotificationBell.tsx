import React from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export const NOTIFICATIONS_HREF = '/dashboard/notifikasi';

/** Kalimat jumlah belum dibaca untuk pembaca layar. */
export function unreadPhrase(count: number): string {
  return count > 0 ? `${count} notifikasi belum dibaca` : 'Tidak ada notifikasi yang belum dibaca';
}

/**
 * Lonceng di kepala portal (desktop & ponsel): ikon + ANGKA belum dibaca (bukan sekadar titik
 * berwarna), menuju halaman notifikasi. Nama aksesibel memuat jumlahnya.
 */
export const NotificationBell: React.FC<{ count: number; active: boolean }> = ({ count, active }) => (
  <Link
    href={NOTIFICATIONS_HREF}
    aria-current={active ? 'page' : undefined}
    className={cn(
      'inline-flex min-h-touch min-w-touch items-center justify-center gap-1.5 rounded-pill px-2.5 text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary',
      active && 'bg-surface-meadow text-action-secondary-text',
    )}
  >
    <Bell className="h-5 w-5 shrink-0" aria-hidden="true" />
    <span className="sr-only">Notifikasi: {unreadPhrase(count)}</span>
    {count > 0 && (
      <span
        aria-hidden="true"
        className="min-w-[1.5rem] rounded-pill bg-action-accent px-1.5 text-center text-xs font-bold leading-6 tabular-nums text-text-on-brand"
      >
        {count > 99 ? '99+' : count}
      </span>
    )}
  </Link>
);

/**
 * Wilayah live tunggal yang mengumumkan perubahan jumlah (mis. setelah "tandai dibaca").
 * Layout portal tetap terpasang saat berpindah halaman, jadi hanya PERUBAHAN yang diumumkan,
 * bukan setiap kali halaman dibuka.
 */
export const NotificationLiveRegion: React.FC<{ count: number }> = ({ count }) => (
  <p className="sr-only" aria-live="polite" aria-atomic="true">
    {unreadPhrase(count)}
  </p>
);
