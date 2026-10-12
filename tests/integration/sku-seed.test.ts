import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { schema } from '@/db';
import { listRequirements, memberProgress, ownProgress } from '@/features/competency/competency';
import { seed } from '../../scripts/seed-demo/23-sku';
import { createTestDb, type TestDb } from '../helpers/test-db';
import { actor } from '../helpers/actors';

/** Seed demo SKU/SKK berjalan di atas skema & migrasi asli dan menghasilkan keadaan yang dipakai e2e. */
let t: TestDb;
beforeEach(async () => {
  t = await createTestDb();
});
afterEach(async () => {
  await t.close();
});

const NOW = new Date('2026-10-10T03:00:00Z');

describe('seed demo SKU/SKK (2.3)', () => {
  it('hanya penanda tempat (tanpa teks resmi), dengan kemajuan contoh untuk pembina & peserta', async () => {
    const [k] = await t.db.insert(schema.kwarran).values({ name: 'Kwarran Demo' }).returning();
    const [g1, g2] = await t.db
      .insert(schema.gudep)
      .values([
        { kwarranId: k.id, name: 'Gudep Pembina' },
        { kwarranId: k.id, name: 'Gudep Lain' },
      ])
      .returning();
    const pg = { gender: 'P' as const, birthDate: '2013-01-01', golongan: 'PENGGALANG' as const, gudepId: g1.id };
    const members = await t.db
      .insert(schema.members)
      .values([
        { ...pg, fullName: 'Citra Contoh', status: 'ACTIVE' },
        { ...pg, fullName: 'Ayu Contoh', status: 'ACTIVE' },
        { ...pg, fullName: 'Bayu Contoh', status: 'ACTIVE' },
        { ...pg, fullName: 'Pending Contoh', status: 'PENDING' },
        { gender: 'L', birthDate: '2009-01-01', golongan: 'PENEGAK', gudepId: g2.id, fullName: 'Dimas Contoh', status: 'PENDING' },
      ])
      .returning();
    const byName = Object.fromEntries(members.map((m) => [m.fullName, m]));
    const users = await t.db
      .insert(schema.users)
      .values([
        { username: 'gudep.smp1', name: 'Pembina Demo', role: 'STAFF_GUDEP', gudepId: g1.id, passwordHash: 'x' },
        { username: 'kwarcab', name: 'Kwarcab Demo', role: 'ADMIN_KWARCAB', passwordHash: 'x' },
        { username: 'peserta.dimas', name: 'Dimas Contoh', role: 'PESERTA', memberId: byName['Dimas Contoh'].id, passwordHash: 'x' },
      ])
      .returning();
    const ctx = {
      db: t.db,
      users: Object.fromEntries(users.map((u) => [u.username, u])),
      kwarran: [k],
      gudep: [g1, g2],
      members,
      events: [],
      daysFromNow: (d: number) => new Date(NOW.getTime() + d * 86_400_000),
    };
    await seed(ctx);
    // Idempoten: dijalankan ulang tidak menggandakan apa pun.
    await seed(ctx);

    const reqs = await t.db.select().from(schema.competencyRequirements);
    expect(reqs.length).toBe(26);
    for (const r of reqs) {
      expect(r.code).toMatch(/^DEMO-/);
      expect(r.title).toMatch(/^Contoh syarat/);
      expect(`${r.title} ${r.description ?? ''}`).not.toMatch(/tri satya|dasa darma|darma/i);
    }
    expect(reqs.filter((r) => !r.active).map((r) => r.code)).toEqual(['DEMO-PG-RAMU-99']);

    const kwarcab = actor('ADMIN_KWARCAB');
    expect((await listRequirements(kwarcab, { golongan: 'PENGGALANG', kind: 'SKU', level: 'Ramu' }, t.db)).total).toBe(6);

    const pembina = actor('STAFF_GUDEP', { gudepId: g1.id });
    const ramu = async (name: string) => (await memberProgress(pembina, byName[name].id, t.db))!.groups[0];
    expect(await ramu('Ayu Contoh')).toMatchObject({ kind: 'SKU', level: 'Ramu', verified: 4, total: 6 });
    const ayuItems = (await ramu('Ayu Contoh')).items;
    expect(ayuItems.find((i) => i.requirement.code === 'DEMO-PG-RAMU-05')).toMatchObject({
      verified: null,
      revoked: { byName: 'Pembina Demo' },
    });
    expect(await ramu('Bayu Contoh')).toMatchObject({ verified: 2, total: 6 });
    // Anggota aktif terakhir sengaja belum diverifikasi (dipakai e2e).
    expect(await ramu('Citra Contoh')).toMatchObject({ verified: 0, total: 6 });
    expect(await ramu('Pending Contoh')).toMatchObject({ verified: 0 });

    const own = await ownProgress(actor('PESERTA', { memberId: byName['Dimas Contoh'].id }), t.db);
    expect(own?.groups.map((g) => [g.kind, g.level, g.verified, g.total])).toEqual([
      ['SKU', 'Bantara', 2, 5],
      ['SKK', 'Contoh SKK B', 1, 3],
    ]);
    expect(JSON.stringify(own)).not.toContain('Contoh catatan pembina');
    // Seed tidak mengirim notifikasi.
    expect(await t.db.select().from(schema.notifications)).toHaveLength(0);
  });
});
