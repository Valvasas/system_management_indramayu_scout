/**
 * Matriks izin (RBAC). Satu-satunya tempat yang menentukan peran boleh melakukan apa.
 * Cakupan data (wilayah/gudep/pribadi) ditangani terpisah di `scope.ts`.
 * Lihat docs/security/authorization-model.md.
 */
import type { Role } from '@/db/schema';

export const PERMISSIONS = [
  'members.read',
  'members.create',
  'members.update',
  'members.verify',
  'members.archive',
  'members.export',
  'members.import',
  'members.view_sensitive',
  'gudep.read',
  'gudep.create',
  'gudep.update',
  'kwarran.manage',
  'users.manage',
  'users.create_peserta',
  'content.manage',
  'announcements.manage',
  'messages.read',
  'settings.manage',
  'audit.view',
  'self.portal',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const STAFF_MEMBER_BASE: Permission[] = [
  'members.read',
  'members.create',
  'members.update',
  'members.export',
  'members.import',
  'members.view_sensitive',
  'gudep.read',
  'gudep.update',
  'announcements.manage',
  'users.create_peserta',
];

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  SUPER_ADMIN: PERMISSIONS.filter((p) => p !== 'self.portal'),
  ADMIN_KWARCAB: PERMISSIONS.filter((p) => p !== 'self.portal'),
  ADMIN_WEBSITE: ['content.manage', 'announcements.manage', 'messages.read', 'settings.manage'],
  STAFF_KWARRAN: [...STAFF_MEMBER_BASE, 'members.verify', 'members.archive', 'gudep.create'],
  STAFF_GUDEP: STAFF_MEMBER_BASE,
  PESERTA: ['self.portal'],
};

export function roleCan(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN_KWARCAB: 'Pengurus Kwarcab',
  ADMIN_WEBSITE: 'Admin Website',
  STAFF_KWARRAN: 'Staf Kwarran',
  STAFF_GUDEP: 'Pembina / Staf Gudep',
  PESERTA: 'Peserta',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  SUPER_ADMIN: 'Akses penuh termasuk mengelola akun admin lain.',
  ADMIN_KWARCAB: 'Mengelola seluruh data anggota, gudep, wilayah, konten, dan akun staf.',
  ADMIN_WEBSITE: 'Mengelola berita, agenda, galeri, dokumen, dan pengaturan situs.',
  STAFF_KWARRAN: 'Mengelola dan memverifikasi data anggota serta gudep di satu kwarran.',
  STAFF_GUDEP: 'Mendata anggota dan lokasi satu gudep. Data baru diverifikasi kwarran.',
  PESERTA: 'Melihat data diri, kegiatan, dan pengumuman gudepnya.',
};

/** Peran yang boleh diberikan oleh pengelola akun tertentu (mencegah eskalasi hak). */
export function assignableRoles(actorRole: Role): Role[] {
  if (actorRole === 'SUPER_ADMIN') return ['SUPER_ADMIN', 'ADMIN_KWARCAB', 'ADMIN_WEBSITE', 'STAFF_KWARRAN', 'STAFF_GUDEP', 'PESERTA'];
  if (actorRole === 'ADMIN_KWARCAB') return ['ADMIN_WEBSITE', 'STAFF_KWARRAN', 'STAFF_GUDEP', 'PESERTA'];
  return [];
}
