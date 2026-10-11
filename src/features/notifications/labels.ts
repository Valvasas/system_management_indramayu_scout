/**
 * Label & aturan tampilan notifikasi (2.1). Modul murni tanpa akses DB: dipakai halaman
 * notifikasi, formulir preferensi, dan tes.
 */
import type { NotificationKind, NotificationPriority, Role } from '@/db/schema';
import { roleCan, type Permission } from '@/lib/auth/permissions';

export const NOTIFICATION_KINDS: readonly NotificationKind[] = [
  'ANNOUNCEMENT',
  'NEWS_REVIEW',
  'NEWS_RETURNED',
  'NEWS_PUBLISHED',
  'TRANSFER_REQUESTED',
  'TRANSFER_DECIDED',
  'ACCESS_REQUEST',
  'CONSENT_DECIDED',
  'EVENT_REGISTRATION',
  'TERM_ENDING',
  'SYSTEM',
];

export const NOTIFICATION_KIND_LABELS: Record<NotificationKind, { label: string; description: string }> = {
  ANNOUNCEMENT: { label: 'Pengumuman', description: 'Pengumuman baru untuk gudep atau wilayah Anda.' },
  NEWS_REVIEW: { label: 'Berita menunggu review', description: 'Kontributor mengirim berita untuk diperiksa sebelum tayang.' },
  NEWS_RETURNED: { label: 'Berita dikembalikan', description: 'Editor meminta perbaikan pada berita yang Anda tulis.' },
  NEWS_PUBLISHED: { label: 'Berita terbit', description: 'Berita yang Anda tulis sudah diterbitkan editor.' },
  TRANSFER_REQUESTED: { label: 'Pengajuan mutasi', description: 'Ada pengajuan mutasi anggota ke gudep dalam wilayah Anda.' },
  TRANSFER_DECIDED: { label: 'Keputusan mutasi', description: 'Pengajuan mutasi yang Anda kirim sudah diputuskan.' },
  ACCESS_REQUEST: { label: 'Permintaan akses', description: 'Akun dalam kewenangan Anda meminta kode akses baru.' },
  CONSENT_DECIDED: { label: 'Persetujuan wali', description: 'Orang tua/wali sudah memberi keputusan persetujuan.' },
  EVENT_REGISTRATION: { label: 'Pendaftar kegiatan', description: 'Ringkasan harian pendaftar baru per kegiatan.' },
  TERM_ENDING: { label: 'Masa jabatan', description: 'Pengingat masa jabatan pengurus yang akan berakhir.' },
  SYSTEM: { label: 'Kabar sistem', description: 'Informasi umum tentang portal.' },
};

export const PRIORITY_LABELS: Record<NotificationPriority, string> = {
  HIGH: 'Prioritas tinggi',
  NORMAL: 'Prioritas biasa',
  LOW: 'Prioritas rendah',
};

/**
 * Jenis yang selalu dikirim dengan prioritas tinggi. Preferensi tidak berlaku untuk prioritas
 * tinggi (lihat notify()), jadi jenis ini tidak ditawarkan untuk dimatikan agar tidak menyesatkan.
 */
export const ALWAYS_HIGH_KINDS: readonly NotificationKind[] = ['ACCESS_REQUEST'];

/** Siapa yang bisa menerima tiap jenis: cukup salah satu izin; 'all' = semua pengguna portal. */
const AUDIENCE: Record<NotificationKind, readonly Permission[] | 'all'> = {
  ANNOUNCEMENT: 'all',
  NEWS_REVIEW: ['content.manage'],
  NEWS_RETURNED: ['content.contribute'],
  NEWS_PUBLISHED: ['content.contribute'],
  TRANSFER_REQUESTED: ['members.verify'],
  TRANSFER_DECIDED: ['members.update'],
  ACCESS_REQUEST: ['users.manage', 'users.create_peserta'],
  CONSENT_DECIDED: ['members.update'],
  EVENT_REGISTRATION: ['content.manage'],
  TERM_ENDING: ['users.manage', 'content.manage'],
  SYSTEM: 'all',
};

/** Jenis yang relevan untuk peran ini (bisa diterima). */
export function kindsForRole(role: Role): NotificationKind[] {
  return NOTIFICATION_KINDS.filter((k) => {
    const who = AUDIENCE[k];
    return who === 'all' || who.some((p) => roleCan(role, p));
  });
}

/** Jenis yang boleh dimatikan oleh peran ini lewat formulir preferensi. */
export function preferenceKindsFor(role: Role): NotificationKind[] {
  return kindsForRole(role).filter((k) => !ALWAYS_HIGH_KINDS.includes(k));
}

/** Jenis berprioritas tinggi yang bisa diterima peran ini (dijelaskan di formulir preferensi). */
export function alwaysOnKindsFor(role: Role): NotificationKind[] {
  return kindsForRole(role).filter((k) => ALWAYS_HIGH_KINDS.includes(k));
}
