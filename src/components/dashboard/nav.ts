/**
 * Definisi menu portal. Server menyaring menu sesuai izin, lalu mengirim
 * hanya data polos (tanpa komponen ikon) ke shell klien.
 */
import type { Permission } from '@/lib/auth/permissions';

export type NavIcon =
  | 'home'
  | 'users'
  | 'map'
  | 'building'
  | 'megaphone'
  | 'inbox'
  | 'globe'
  | 'settings'
  | 'shield'
  | 'list'
  | 'calendar'
  | 'user';

export interface NavItem {
  href: string;
  label: string;
  icon: NavIcon;
  badge?: number;
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

interface NavDef extends Omit<NavItem, 'badge'> {
  permission?: Permission;
  badgeKey?: 'pendingMembers' | 'unreadMessages';
}

const STAFF_NAV: { title?: string; items: NavDef[] }[] = [
  { items: [{ href: '/dashboard', label: 'Ringkasan', icon: 'home' }] },
  {
    title: 'Data organisasi',
    items: [
      { href: '/dashboard/anggota', label: 'Anggota', icon: 'users', permission: 'members.read', badgeKey: 'pendingMembers' },
      { href: '/dashboard/gudep', label: 'Gudep & lokasi', icon: 'map', permission: 'gudep.read' },
      { href: '/dashboard/kwarran', label: 'Kwarran', icon: 'building', permission: 'kwarran.manage' },
    ],
  },
  {
    title: 'Komunikasi',
    items: [
      { href: '/dashboard/pengumuman', label: 'Pengumuman', icon: 'megaphone', permission: 'announcements.manage' },
      { href: '/dashboard/pesan', label: 'Pesan masuk', icon: 'inbox', permission: 'messages.read', badgeKey: 'unreadMessages' },
    ],
  },
  {
    title: 'Situs publik',
    items: [
      { href: '/dashboard/konten', label: 'Konten situs', icon: 'globe', permission: 'content.manage' },
      { href: '/dashboard/pengaturan', label: 'Tampilan beranda', icon: 'settings', permission: 'settings.manage' },
    ],
  },
  {
    title: 'Sistem',
    items: [
      { href: '/dashboard/pengguna', label: 'Pengguna & akses', icon: 'shield', permission: 'users.manage' },
      { href: '/dashboard/log', label: 'Log aktivitas', icon: 'list', permission: 'audit.view' },
    ],
  },
];

const PESERTA_NAV: { title?: string; items: NavDef[] }[] = [
  {
    items: [
      { href: '/dashboard', label: 'Ringkasan', icon: 'home' },
      { href: '/dashboard/kegiatan', label: 'Kegiatan', icon: 'calendar' },
      { href: '/dashboard/profil', label: 'Profil saya', icon: 'user' },
    ],
  },
];

export function buildNav(
  isPeserta: boolean,
  has: (p: Permission) => boolean,
  badges: Partial<Record<'pendingMembers' | 'unreadMessages', number>>,
): NavGroup[] {
  return (isPeserta ? PESERTA_NAV : STAFF_NAV)
    .map((g) => ({
      title: g.title,
      items: g.items
        .filter((i) => !i.permission || has(i.permission))
        .map(({ permission: _p, badgeKey, ...i }) => ({ ...i, badge: badgeKey ? badges[badgeKey] || undefined : undefined })),
    }))
    .filter((g) => g.items.length > 0);
}
