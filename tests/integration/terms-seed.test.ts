import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { schema } from '@/db';
import type { Role, UserRow } from '@/db/schema';
import { listAssignments } from '@/features/terms/assignments';
import { boardOverview } from '@/features/terms/board';
import { sendTermReminders } from '@/features/terms/reminders';
import { getOrganizationMembers } from '@/lib/repositories/organization';
import { seed } from '../../scripts/seed-demo/24-masa-jabatan';
import { createTestDb, type TestDb } from '../helpers/test-db';
import { actor } from '../helpers/actors';

/** Seed demo masa jabatan berjalan di atas migrasi asli dan menghasilkan keadaan yang dipakai demo. */
let t: TestDb;
beforeEach(async () => {
  t = await createTestDb();
});
afterEach(async () => {
  await t.close();
});

describe('seed demo masa jabatan (2.4)', () => {
  it('pengurus hampir berakhir + periode lalu, penugasan staf, dan pengingat tanpa duplikat', async () => {
    const [k] = await t.db.insert(schema.kwarran).values({ name: 'Indramayu' }).returning();
    const gudep = await t.db
      .insert(schema.gudep)
      .values([
        { kwarranId: k.id, name: 'Gudep SMP Contoh' },
        { kwarranId: k.id, name: 'Gudep SD Contoh' },
      ])
      .returning();
    const accounts: [string, Role, Partial<typeof schema.users.$inferInsert>][] = [
      ['admin', 'SUPER_ADMIN', {}],
      ['kwarcab', 'ADMIN_KWARCAB', {}],
      ['humas', 'ADMIN_WEBSITE', {}],
      ['kwarran.indramayu', 'STAFF_KWARRAN', { kwarranId: k.id }],
      ['gudep.smp1', 'STAFF_GUDEP', { gudepId: gudep[0].id }],
    ];
    const users: Record<string, UserRow> = {};
    for (const [username, role, over] of accounts) {
      const [u] = await t.db
        .insert(schema.users)
        .values({ username, name: username, passwordHash: 'x', role, ...over })
        .returning();
      users[username] = u;
    }
    // Sama dengan seed.ts: pengurus demo tanpa masa jabatan (data lama).
    await t.db.insert(schema.boardMembers).values([
      { name: 'Kak Contoh Ketua', position: 'Ketua Kwartir Cabang', department: 'Pimpinan', period: '2026–2031', sortOrder: 1 },
      { name: 'Kak Contoh Sekretaris', position: 'Sekretaris', department: 'Pimpinan', period: '2026–2031', sortOrder: 2 },
      {
        name: 'Kak Contoh Ketua DKC',
        position: 'Ketua Dewan Kerja Cabang',
        department: 'Dewan Kerja Cabang',
        period: '2026–2031',
        sortOrder: 10,
      },
    ]);

    await seed({ db: t.db, users, kwarran: [k], gudep, members: [], events: [], daysFromNow: () => new Date() });

    const now = new Date();
    const publicNames = (await getOrganizationMembers(now, t.db)).map((m) => m.name).sort();
    expect(publicNames).toEqual(['Kak Contoh Ketua', 'Kak Contoh Ketua DKC', 'Kak Contoh Sekretaris']);

    const overview = await boardOverview(actor('ADMIN_WEBSITE'), now, t.db);
    expect(overview!.ending.map((b) => [b.name, b.daysLeft])).toEqual([['Kak Contoh Sekretaris', 21]]);
    expect(overview!.past.map((b) => b.name)).toEqual(['Kak Contoh Sekretaris Periode Lalu']);

    const kwarcab = actor('ADMIN_KWARCAB');
    const staffHistory = await listAssignments(kwarcab, users['kwarran.indramayu'].id, now, t.db);
    expect(staffHistory!.map((a) => [a.position, a.state])).toEqual([
      ['Andalan Kwarran Urusan Data', 'ENDING'],
      ['Pembina Gudep', 'ENDED'],
    ]);
    expect(await listAssignments(kwarcab, users['gudep.smp1'].id, now, t.db)).toEqual([
      expect.objectContaining({ position: 'Pembina Gudep', gudepName: 'Gudep SMP Contoh', state: 'ACTIVE' }),
    ]);

    // Penugasan tidak mengubah cakupan akun.
    const after = await t.db.select().from(schema.users);
    for (const u of after)
      expect({ k: u.kwarranId, g: u.gudepId }).toEqual({ k: users[u.username].kwarranId, g: users[u.username].gudepId });

    // Pengingat: Sekretaris → content.manage (3 akun), Staf Kwarran → users.manage (2 akun).
    const notes = await t.db.select().from(schema.notifications);
    expect(notes).toHaveLength(5);
    expect(notes.every((n) => n.kind === 'TERM_ENDING' && n.href?.startsWith('/dashboard/'))).toBe(true);
    expect((await sendTermReminders(now, t.db)).sent).toBe(0);
  });
});
