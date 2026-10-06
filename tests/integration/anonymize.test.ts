import { eq, sql } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { schema } from '@/db';
import { anonymizeMember } from '@/features/members/anonymize';
import { roleCan } from '@/lib/auth/permissions';
import { createTestDb, type TestDb } from '../helpers/test-db';
import { actor } from '../helpers/actors';

let t: TestDb;
let gudepA: string;
let gudepB: string;
let memberId: string;
let userId: string;
const NOW = new Date('2026-10-06T08:00:00Z');

beforeEach(async () => {
  t = await createTestDb();
  const [k] = await t.db.insert(schema.kwarran).values({ name: 'Kwarran Uji' }).returning();
  const [k2] = await t.db.insert(schema.kwarran).values({ name: 'Kwarran Lain' }).returning();
  const [a] = await t.db.insert(schema.gudep).values({ kwarranId: k.id, name: 'Gudep A' }).returning();
  const [b] = await t.db.insert(schema.gudep).values({ kwarranId: k2.id, name: 'Gudep B' }).returning();
  gudepA = a.id;
  gudepB = b.id;
  const [m] = await t.db
    .insert(schema.members)
    .values({
      fullName: 'Bayu Samudra',
      gender: 'L',
      birthDate: '2011-07-19',
      golongan: 'PENGGALANG',
      gudepId: gudepA,
      kta: '10.12.11.9999',
      phone: '0812-1111-2222',
      address: 'Jl. Uji 7',
      guardianName: 'Pak Samudra',
      guardianPhone: '0813-3333-4444',
      notes: 'Alergi kacang',
      status: 'ACTIVE',
      joinedAt: '2024-07-01',
    })
    .returning();
  memberId = m.id;
  const [u] = await t.db
    .insert(schema.users)
    .values({ username: 'peserta.bayu', name: 'Bayu Samudra', passwordHash: 'x', role: 'PESERTA', memberId, gudepId: gudepA })
    .returning();
  userId = u.id;
  await t.db.insert(schema.sessions).values({ id: 'sesi-bayu', userId, expiresAt: new Date(NOW.getTime() + 86_400_000) });
  await t.db.insert(schema.guardianConsents).values({
    memberId,
    scope: 'DATA',
    granted: true,
    textVersion: '2026-10-v1',
    method: 'GUARDIAN_CODE',
    guardianName: 'Pak Samudra',
    ipHash: 'abc',
  });
  const [ev] = await t.db
    .insert(schema.events)
    .values({ title: 'Kemah', slug: 'kemah', dateStart: NOW, location: 'Lapangan', organizer: 'Kwarcab' })
    .returning();
  await t.db.insert(schema.eventRegistrations).values({ eventId: ev.id, memberId });
});
afterEach(async () => {
  await t.close();
});

const kwarcab = () => actor('ADMIN_KWARCAB');

describe('anonimisasi anggota nonaktif (hak subjek data, 1.4)', () => {
  it('hanya tingkat Kwarcab yang memegang izin anonimisasi', () => {
    expect(roleCan('SUPER_ADMIN', 'members.anonymize')).toBe(true);
    expect(roleCan('ADMIN_KWARCAB', 'members.anonymize')).toBe(true);
    for (const r of ['ADMIN_WEBSITE', 'STAFF_KWARRAN', 'STAFF_GUDEP', 'PESERTA'] as const)
      expect(roleCan(r, 'members.anonymize')).toBe(false);
  });

  it('anggota aktif harus diarsipkan dulu; di luar cakupan tidak ditemukan', async () => {
    expect(await anonymizeMember(kwarcab(), memberId, NOW, t.db)).toEqual({ ok: false, reason: 'belum-nonaktif' });
    await t.db.update(schema.members).set({ status: 'ARCHIVED' }).where(eq(schema.members.id, memberId));
    const otherKwarran = actor('STAFF_KWARRAN', {
      kwarranId: (await t.db.select().from(schema.gudep).where(eq(schema.gudep.id, gudepB)))[0].kwarranId,
    });
    expect(await anonymizeMember(otherKwarran, memberId, NOW, t.db)).toEqual({ ok: false, reason: 'tidak-ditemukan' });
  });

  it('menghapus identitas, mempertahankan statistik & riwayat, menonaktifkan akun', async () => {
    await t.db.update(schema.members).set({ status: 'ARCHIVED' }).where(eq(schema.members.id, memberId));
    const r = await anonymizeMember(kwarcab(), memberId, NOW, t.db);
    expect(r.ok).toBe(true);

    const [m] = await t.db.select().from(schema.members).where(eq(schema.members.id, memberId));
    expect(m).toMatchObject({
      fullName: expect.stringMatching(/^Anggota dianonimkan #/),
      kta: null,
      birthDate: '2011-01-01',
      phone: null,
      address: null,
      guardianName: null,
      guardianPhone: null,
      notes: null,
      golongan: 'PENGGALANG',
      gudepId: gudepA,
      joinedAt: '2024-07-01',
    });
    expect(m.anonymizedAt).not.toBeNull();
    const raw = JSON.stringify((await t.db.execute(sql`SELECT * FROM members`)) as unknown);
    expect(raw).not.toMatch(/Bayu|Samudra|0812|Jl\. Uji|Alergi/);

    const consents = await t.db.select().from(schema.guardianConsents);
    expect(consents).toHaveLength(1);
    expect(consents[0]).toMatchObject({ granted: true, guardianName: null, ipHash: null });
    expect(await t.db.select().from(schema.eventRegistrations)).toHaveLength(1);

    const [u] = await t.db.select().from(schema.users).where(eq(schema.users.id, userId));
    expect(u).toMatchObject({ active: false, name: 'Akun dianonimkan' });
    expect(u.username).not.toContain('bayu');
    expect(await t.db.select().from(schema.sessions)).toHaveLength(0);

    expect(await anonymizeMember(kwarcab(), memberId, NOW, t.db)).toEqual({ ok: false, reason: 'sudah' });
  });
});
