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
  | 'user'
  | 'swap'
  | 'clipboard'
  | 'pen'
  | 'key';

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

export type BadgeKey = 'pendingMembers' | 'unreadMessages' | 'pendingTransfers' | 'resetRequests' | 'reviewNews';

interface NavDef extends Omit<NavItem, 'badge'> {
  /** Satu izin, atau daftar izin (cukup salah satu). */
  permission?: Permission | Permission[];
  /** Sembunyikan bila pengguna punya izin ini (mis. editor tidak perlu menu kontributor). */
  unless?: Permission;
  badgeKey?: BadgeKey;
}

const STAFF_NAV: { title?: string; items: NavDef[] }[] = [
  { items: [{ href: '/dashboard', label: 'Ringkasan', icon: 'home' }] },
  {
    title: 'Data organisasi',
    items: [
      { href: '/dashboard/anggota', label: 'Anggota', icon: 'users', permission: 'members.read', badgeKey: 'pendingMembers' },
      { href: '/dashboard/gudep', label: 'Gudep & lokasi', icon: 'map', permission: 'gudep.read' },
      { href: '/dashboard/kwarran', label: 'Kwarran', icon: 'building', permission: 'kwarran.manage' },
      { href: '/dashboard/mutasi', label: 'Mutasi anggota', icon: 'swap', permission: 'members.update', badgeKey: 'pendingTransfers' },
      { href: '/dashboard/pendaftaran', label: 'Pendaftaran kegiatan', icon: 'clipboard', permission: 'members.read' },
    ],
  },
  {
    title: 'Komunikasi',
    items: [
      { href: '/dashboard/pengumuman', label: 'Pengumuman', icon: 'megaphone', permission: 'announcements.manage' },
      { href: '/dashboard/pesan', label: 'Pesan masuk', icon: 'inbox', permission: 'messages.read', badgeKey: 'unreadMessages' },
      { href: '/dashboard/kontribusi', label: 'Tulis berita', icon: 'pen', permission: 'content.contribute', unless: 'content.manage' },
    ],
  },
  {
    title: 'Situs publik',
    items: [
      { href: '/dashboard/konten', label: 'Konten situs', icon: 'globe', permission: 'content.manage', badgeKey: 'reviewNews' },
      { href: '/dashboard/pengaturan', label: 'Tampilan beranda', icon: 'settings', permission: 'settings.manage' },
    ],
  },
  {
    title: 'Sistem',
    items: [
      { href: '/dashboard/pengguna', label: 'Pengguna & akses', icon: 'shield', permission: 'users.manage' },
      {
        href: '/dashboard/akses',
        label: 'Permintaan akses',
        icon: 'key',
        permission: ['users.manage', 'users.create_peserta'],
        badgeKey: 'resetRequests',
      },
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

export function buildNav(isPeserta: boolean, has: (p: Permission) => boolean, badges: Partial<Record<BadgeKey, number>>): NavGroup[] {
  const allowed = (i: NavDef) => {
    if (i.unless && has(i.unless)) return false;
    if (!i.permission) return true;
    return Array.isArray(i.permission) ? i.permission.some(has) : has(i.permission);
  };
  return (isPeserta ? PESERTA_NAV : STAFF_NAV)
    .map((g) => ({
      title: g.title,
      items: g.items
        .filter(allowed)
        .map(({ permission: _p, unless: _u, badgeKey, ...i }) => ({ ...i, badge: badgeKey ? badges[badgeKey] || undefined : undefined })),
    }))
    .filter((g) => g.items.length > 0);
}
