import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { notificationKindEnum, roleEnum } from '@/db/schema';
import { InboxQuerySchema } from '@/features/notifications/inbox';
import {
  ALWAYS_HIGH_KINDS,
  NOTIFICATION_KIND_LABELS,
  NOTIFICATION_KINDS,
  alwaysOnKindsFor,
  kindsForRole,
  preferenceKindsFor,
} from '@/features/notifications/labels';
import { wibDay } from '@/features/notifications/triggers';

describe('label & preferensi notifikasi (2.1)', () => {
  it('setiap jenis di skema punya label dan masuk daftar', () => {
    expect([...NOTIFICATION_KINDS].sort()).toEqual([...notificationKindEnum.enumValues].sort());
    for (const k of notificationKindEnum.enumValues) expect(NOTIFICATION_KIND_LABELS[k].label.length).toBeGreaterThan(0);
  });

  it('peserta hanya ditawari jenis yang memang bisa ia terima', () => {
    expect(kindsForRole('PESERTA')).toEqual(['ANNOUNCEMENT', 'SYSTEM']);
    expect(preferenceKindsFor('PESERTA')).toEqual(['ANNOUNCEMENT', 'SYSTEM']);
    expect(alwaysOnKindsFor('PESERTA')).toEqual([]);
  });

  it('jenis berprioritas tinggi tidak pernah bisa dimatikan lewat formulir', () => {
    for (const role of roleEnum.enumValues) {
      for (const k of ALWAYS_HIGH_KINDS) expect(preferenceKindsFor(role)).not.toContain(k);
    }
    expect(alwaysOnKindsFor('STAFF_GUDEP')).toEqual(['ACCESS_REQUEST']);
    // Admin website tidak menangani akses akun maupun mutasi.
    expect(kindsForRole('ADMIN_WEBSITE')).not.toContain('ACCESS_REQUEST');
    expect(kindsForRole('ADMIN_WEBSITE')).not.toContain('TRANSFER_REQUESTED');
    expect(kindsForRole('STAFF_GUDEP')).not.toContain('TRANSFER_REQUESTED');
    expect(kindsForRole('STAFF_KWARRAN')).toContain('TRANSFER_REQUESTED');
  });

  it('parameter URL asing jatuh ke nilai bawaan', () => {
    expect(InboxQuerySchema.parse({})).toEqual({ halaman: 1, tampil: 'semua' });
    expect(InboxQuerySchema.parse({ halaman: '-3', tampil: 'apa' })).toEqual({ halaman: 1, tampil: 'semua' });
    expect(InboxQuerySchema.parse({ halaman: ['2', '3'], tampil: 'belum' })).toEqual({ halaman: 1, tampil: 'belum' });
    expect(InboxQuerySchema.parse({ halaman: '4' })).toEqual({ halaman: 4, tampil: 'semua' });
  });

  it('hari WIB berganti pukul 00.00 WIB (17.00 UTC)', () => {
    expect(wibDay(new Date('2026-10-10T16:59:59Z'))).toBe('2026-10-10');
    expect(wibDay(new Date('2026-10-10T17:00:00Z'))).toBe('2026-10-11');
  });
});

describe('pemicu notifikasi terpasang di aksi utama (2.1)', () => {
  const wiring: [string, string][] = [
    ['src/features/announcements/actions.ts', 'notifyAnnouncementCreated'],
    ['src/features/content/contributions.ts', 'notifyNewsSubmitted'],
    ['src/features/content/news.ts', 'notifyNewsReturned'],
    ['src/features/content/news.ts', 'notifyNewsPublished'],
    ['src/features/members/transfer-actions.ts', 'notifyTransferRequested'],
    ['src/features/members/transfer-actions.ts', 'notifyTransferDecided'],
    ['src/features/auth/access-actions.ts', 'notifyAccessRequested'],
    ['src/features/consent/consent-actions.ts', 'notifyConsentDecided'],
    ['src/features/portal/actions.ts', 'notifyEventRegistration'],
  ];
  const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

  it.each(wiring)('%s memanggil %s', (file, fn) => {
    expect(read(file)).toContain(`await ${fn}(`);
  });

  it('jawaban publik lupa sandi tetap satu pesan generik (tanpa enumerasi akun)', () => {
    const src = read('src/features/auth/access-actions.ts');
    const body = src.slice(src.indexOf('export async function requestPasswordResetAction'), src.indexOf('/* Publik: tukar kode akses'));
    expect(body.match(/return ok\(/g)).toEqual(['return ok(']);
    expect(body).toContain('return ok(GENERIC_REQUEST);');
    // Pemicu dipanggil di dalam cabang "akun ada & belum ada permintaan terbuka", bukan di jalur jawaban.
    expect(body.indexOf('notifyAccessRequested')).toBeLessThan(body.indexOf('return ok(GENERIC_REQUEST)'));
  });

  it('isi notifikasi mutasi & persetujuan tidak pernah diberi alasan, catatan, atau nama wali', () => {
    const src = read('src/features/notifications/triggers.ts');
    for (const field of ['reason', 'decisionNote', 'guardianName', 'fullName', '.note']) expect(src).not.toContain(field);
  });
});
