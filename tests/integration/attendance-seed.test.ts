import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { schema } from '@/db';
import { attendanceSheet, ownAttendanceHistory } from '@/features/attendance/attendance';
import { seed } from '../../scripts/seed-demo/22-presensi';
import { createTestDb, type TestDb } from '../helpers/test-db';
import { actor } from '../helpers/actors';

/** Seed demo presensi berjalan di atas skema & migrasi asli dan menghasilkan keadaan yang dipakai e2e. */
let t: TestDb;
beforeEach(async () => {
  t = await createTestDb();
});
afterEach(async () => {
  await t.close();
});

const NOW = new Date('2026-10-06T08:00:00Z');

describe('seed demo presensi (2.2)', () => {
  it('mendaftarkan & mencatat sebagian pendaftar Jambore; satu anggota gudep pembina belum dicatat', async () => {
    const [k] = await t.db.insert(schema.kwarran).values({ name: 'Kwarran Demo' }).returning();
    const [g1, g2] = await t.db
      .insert(schema.gudep)
      .values([
        { kwarranId: k.id, name: 'Gudep Pembina' },
        { kwarranId: k.id, name: 'Gudep Lain' },
      ])
      .returning();
    const base = { gender: 'P' as const, birthDate: '2013-01-01', golongan: 'PENGGALANG' as const };
    const members = await t.db
      .insert(schema.members)
      .values([
        { ...base, fullName: 'Citra Contoh', gudepId: g1.id, status: 'ACTIVE' },
        { ...base, fullName: 'Ayu Contoh', gudepId: g1.id, status: 'ACTIVE' },
        { ...base, fullName: 'Bayu Contoh', gudepId: g1.id, status: 'ACTIVE' },
        { ...base, fullName: 'Pending Contoh', gudepId: g1.id, status: 'PENDING' },
        ...Array.from({ length: 7 }, (_, i) => ({ ...base, fullName: `Lain ${i}`, gudepId: g2.id, status: 'ACTIVE' as const })),
        { ...base, fullName: 'Dimas Contoh', gudepId: g2.id, status: 'PENDING' },
      ])
      .returning();
    const dimas = members.find((m) => m.fullName === 'Dimas Contoh')!;
    const users = await t.db
      .insert(schema.users)
      .values([
        { username: 'gudep.smp1', name: 'Pembina Demo', role: 'STAFF_GUDEP', gudepId: g1.id, passwordHash: 'x' },
        { username: 'kwarcab', name: 'Kwarcab Demo', role: 'ADMIN_KWARCAB', passwordHash: 'x' },
        { username: 'peserta.dimas', name: 'Dimas Contoh', role: 'PESERTA', memberId: dimas.id, passwordHash: 'x' },
      ])
      .returning();
    const events = await t.db
      .insert(schema.events)
      .values({
        slug: 'jambore-ranting-serentak',
        title: 'Jambore Ranting Serentak',
        dateStart: new Date('2026-08-14T01:00:00Z'),
        location: 'Seluruh Kwartir Ranting',
        organizer: 'Kwarran',
        published: true,
      })
      .returning();

    await seed({
      db: t.db,
      users: Object.fromEntries(users.map((u) => [u.username, u])),
      kwarran: [k],
      gudep: [g1, g2],
      members,
      events,
      daysFromNow: (d) => new Date(NOW.getTime() + d * 86_400_000),
    });

    expect(await t.db.select().from(schema.eventRegistrations)).toHaveLength(3 + 5 + 1);
    const pembina = actor('STAFF_GUDEP', { gudepId: g1.id });
    const sheet = await attendanceSheet(pembina, events[0].id, { db: t.db, now: NOW });
    expect(sheet?.rows.map((r) => [r.fullName, r.status])).toEqual([
      ['Ayu Contoh', 'PRESENT'],
      ['Bayu Contoh', 'EXCUSED'],
      ['Citra Contoh', null],
    ]);
    expect(sheet?.recap).toEqual({ present: 1, excused: 1, absent: 0, notRecorded: 1, total: 3 });
    expect(sheet?.rows.find((r) => r.status === 'EXCUSED')?.recordedByName).toBe('Pembina Demo');
    const history = await ownAttendanceHistory(actor('PESERTA', { memberId: dimas.id }), { db: t.db });
    expect(history.map((h) => [h.title, h.status])).toEqual([['Jambore Ranting Serentak', 'PRESENT']]);
  });
});
