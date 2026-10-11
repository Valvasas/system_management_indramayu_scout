import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { schema } from '@/db';
import type { Role, UserRow } from '@/db/schema';
import { kindsForRole } from '@/features/notifications/labels';
import { safeHref } from '@/features/notifications/notify';
import { seed } from '../../scripts/seed-demo/21-notifikasi';
import { createTestDb, type TestDb } from '../helpers/test-db';

let t: TestDb;

beforeEach(async () => {
  t = await createTestDb();
});
afterEach(async () => {
  await t.close();
});

describe('seed demo notifikasi (2.1)', () => {
  it('hanya jenis yang relevan untuk peran penerima, dengan tautan internal', async () => {
    const accounts: [string, Role][] = [
      ['admin', 'SUPER_ADMIN'],
      ['kwarcab', 'ADMIN_KWARCAB'],
      ['humas', 'ADMIN_WEBSITE'],
      ['kwarran.indramayu', 'STAFF_KWARRAN'],
      ['gudep.smp1', 'STAFF_GUDEP'],
      ['peserta.dimas', 'PESERTA'],
    ];
    const users: Record<string, UserRow> = {};
    for (const [username, role] of accounts) {
      const [u] = await t.db.insert(schema.users).values({ username, name: username, passwordHash: 'x', role }).returning();
      users[username] = u;
    }
    const [event] = await t.db
      .insert(schema.events)
      .values({
        slug: 'latihan-gabungan-kwarran-indramayu',
        title: 'Latihan Gabungan Kwarran Indramayu',
        dateStart: new Date('2026-11-01T01:00:00Z'),
        location: 'Lapangan',
        organizer: 'Kwarran Indramayu',
        published: true,
        registrationOpen: true,
      })
      .returning();
    const daysFromNow = (d: number, hour = 8) => {
      const x = new Date();
      x.setDate(x.getDate() + d);
      x.setHours(hour, 0, 0, 0);
      return x;
    };

    await seed({ db: t.db, users, kwarran: [], gudep: [], members: [], events: [event], daysFromNow });

    const rows = await t.db.select().from(schema.notifications);
    expect(rows.length).toBeGreaterThan(10);
    const roleOf = new Map(Object.values(users).map((u) => [u.id, u.role]));
    for (const r of rows) {
      expect(kindsForRole(roleOf.get(r.userId)!)).toContain(r.kind);
      expect(safeHref(r.href)).toBe(r.href);
    }
    // Peserta tidak pernah menerima kabar tugas pengurus.
    const dimas = rows.filter((r) => r.userId === users['peserta.dimas'].id);
    expect(dimas.length).toBeGreaterThan(0);
    expect(dimas.every((r) => r.kind === 'ANNOUNCEMENT' || r.kind === 'SYSTEM')).toBe(true);
    // Halaman notifikasi demo memperlihatkan ketiga prioritas dan status dibaca/belum.
    expect(new Set(rows.map((r) => r.priority))).toEqual(new Set(['HIGH', 'NORMAL', 'LOW']));
    expect(rows.some((r) => r.readAt) && rows.some((r) => !r.readAt)).toBe(true);
    // Pendaftar kegiatan: satu per penerima per hari (kunci dedupe sama dengan pemicu sungguhan).
    const reg = rows.filter((r) => r.kind === 'EVENT_REGISTRATION');
    expect(reg.every((r) => r.dedupeKey?.startsWith(`event-registration:${event.id}:`))).toBe(true);
    expect(reg.find((r) => r.userId === users.humas.id)?.href).toBe(`/dashboard/konten/agenda/${event.id}`);
  });
});
