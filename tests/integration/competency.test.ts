import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { schema } from '@/db';
import type { Role } from '@/db/schema';
import {
  getRequirement,
  listRequirements,
  memberProgress,
  ownProgress,
  revokeVerification,
  saveRequirement,
  saveRequirementForm,
  setRequirementActive,
  verificationForm,
  verifyRequirement,
} from '@/features/competency/competency';
import { progressExport } from '@/features/competency/export';
import { RequirementSchema, type RequirementInput } from '@/features/competency/validation';
import { roleCan } from '@/lib/auth/permissions';
import { parseCsv } from '@/lib/csv';
import { createTestDb, type TestDb } from '../helpers/test-db';
import { actor } from '../helpers/actors';

let t: TestDb;
let k1: string;
let k2: string;
let gudepA: string;
let gudepB: string;
let gudepC: string;
let memberA: string;
let memberB: string;
let memberC: string;
let archived: string;
let pesertaUserA: string;
const req: Record<string, string> = {};
const NOW = new Date('2026-10-10T03:00:00Z');

const input = (over: Partial<RequirementInput> = {}): RequirementInput => ({
  kind: 'SKU',
  golongan: 'PENGGALANG',
  level: 'Ramu',
  code: 'UJI-PG-RAMU-01',
  title: 'Contoh syarat uji',
  description: null,
  sortOrder: 1,
  ...over,
});

beforeEach(async () => {
  t = await createTestDb();
  const [ka, kb] = await t.db
    .insert(schema.kwarran)
    .values([{ name: 'Kwarran Satu' }, { name: 'Kwarran Dua' }])
    .returning();
  k1 = ka.id;
  k2 = kb.id;
  const [a, b, c] = await t.db
    .insert(schema.gudep)
    .values([
      { kwarranId: k1, name: 'Gudep A' },
      { kwarranId: k1, name: 'Gudep B' },
      { kwarranId: k2, name: 'Gudep C' },
    ])
    .returning();
  gudepA = a.id;
  gudepB = b.id;
  gudepC = c.id;
  const rows = await t.db
    .insert(schema.members)
    .values([
      {
        fullName: 'Anggota A',
        gender: 'L',
        birthDate: '2013-01-01',
        golongan: 'PENGGALANG',
        gudepId: gudepA,
        status: 'ACTIVE',
        kta: 'KTA-A',
      },
      { fullName: 'Anggota B', gender: 'P', birthDate: '2013-02-02', golongan: 'PENGGALANG', gudepId: gudepB, status: 'ACTIVE' },
      { fullName: 'Anggota C', gender: 'L', birthDate: '2013-03-03', golongan: 'PENGGALANG', gudepId: gudepC, status: 'ACTIVE' },
      { fullName: 'Anggota Arsip', gender: 'P', birthDate: '2013-04-04', golongan: 'PENGGALANG', gudepId: gudepA, status: 'ARCHIVED' },
    ])
    .returning();
  [memberA, memberB, memberC, archived] = rows.map((x) => x.id);
  const [u] = await t.db
    .insert(schema.users)
    .values({ username: 'peserta.a', name: 'Peserta A', passwordHash: 'x', role: 'PESERTA', memberId: memberA })
    .returning();
  pesertaUserA = u.id;

  const reqs = await t.db
    .insert(schema.competencyRequirements)
    .values([
      { kind: 'SKU', golongan: 'PENGGALANG', level: 'Ramu', code: 'R1', title: 'Ramu satu', sortOrder: 1 },
      { kind: 'SKU', golongan: 'PENGGALANG', level: 'Ramu', code: 'R2', title: 'Ramu dua', sortOrder: 2 },
      { kind: 'SKU', golongan: 'PENGGALANG', level: 'Ramu', code: 'R3', title: 'Ramu tiga', sortOrder: 3 },
      { kind: 'SKU', golongan: 'PENGGALANG', level: 'Ramu', code: 'R-OFF', title: 'Ramu nonaktif', sortOrder: 4, active: false },
      { kind: 'SKU', golongan: 'PENGGALANG', level: 'Rakit', code: 'K1', title: 'Rakit satu', sortOrder: 101 },
      { kind: 'SKK', golongan: 'PENGGALANG', level: 'Pengamat Burung', code: 'S1', title: 'SKK satu', sortOrder: 1 },
      { kind: 'SKU', golongan: 'SIAGA', level: 'Mula', code: 'SG1', title: 'Siaga satu', sortOrder: 1 },
    ])
    .returning();
  for (const x of reqs) req[x.code] = x.id;
});
afterEach(async () => {
  await t.close();
});

const kwarcab = () => actor('ADMIN_KWARCAB');
const staffA = () => actor('STAFF_GUDEP', { gudepId: gudepA, name: 'Kak Pembina A' });
const staffB = () => actor('STAFF_GUDEP', { gudepId: gudepB });
const kwarran1 = () => actor('STAFF_KWARRAN', { kwarranId: k1, name: 'Kak Kwarran Satu' });
const kwarran2 = () => actor('STAFF_KWARRAN', { kwarranId: k2 });
const pesertaA = () => actor('PESERTA', { id: pesertaUserA, memberId: memberA });

const verifications = (memberId: string) =>
  t.db.select().from(schema.memberCompetencies).where(eq(schema.memberCompetencies.memberId, memberId));

const form = (fields: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
};

const auditRows = () => t.db.select().from(schema.auditLogs).orderBy(schema.auditLogs.id);

describe('daftar syarat SKU/SKK (competency.manage)', () => {
  it('hanya peran tingkat Kwarcab yang memegang competency.manage', () => {
    const holders = (['SUPER_ADMIN', 'ADMIN_KWARCAB', 'ADMIN_WEBSITE', 'STAFF_KWARRAN', 'STAFF_GUDEP', 'PESERTA'] as Role[]).filter(
      (role) => roleCan(role, 'competency.manage'),
    );
    expect(holders).toEqual(['SUPER_ADMIN', 'ADMIN_KWARCAB']);
  });

  it('peran lain tidak bisa membuat, mengubah, menonaktifkan, atau membaca daftar kelola', async () => {
    for (const a of [staffA(), kwarran1(), actor('ADMIN_WEBSITE'), pesertaA()]) {
      expect(await saveRequirement(a, null, input(), { db: t.db })).toEqual({ ok: false, reason: 'tidak-ditemukan' });
      expect(await saveRequirement(a, req.R1, input({ code: 'R1', title: 'Diubah' }), { db: t.db })).toEqual({
        ok: false,
        reason: 'tidak-ditemukan',
      });
      expect(await setRequirementActive(a, req.R1, false, { db: t.db })).toBeNull();
      expect(await getRequirement(a, req.R1, t.db)).toBeNull();
      expect((await listRequirements(a, {}, t.db)).rows).toEqual([]);
    }
    const [r1] = await t.db.select().from(schema.competencyRequirements).where(eq(schema.competencyRequirements.id, req.R1));
    expect(r1).toMatchObject({ title: 'Ramu satu', active: true });
  });

  it('Kwarcab membuat & mengubah; kode unik tanpa beda huruf besar/kecil', async () => {
    const created = await saveRequirement(kwarcab(), null, input({ code: 'uji-1' }), { db: t.db });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect((await getRequirement(kwarcab(), created.id, t.db))?.code).toBe('UJI-1');
    expect(await saveRequirement(kwarcab(), null, input({ code: 'UJI-1' }), { db: t.db })).toEqual({ ok: false, reason: 'kode-dipakai' });
    expect(await saveRequirement(kwarcab(), req.R2, input({ code: 'uji-1' }), { db: t.db })).toEqual({ ok: false, reason: 'kode-dipakai' });
    // Menyimpan ulang dengan kode sendiri tetap boleh.
    expect(await saveRequirement(kwarcab(), created.id, input({ code: 'UJI-1', title: 'Judul baru', sortOrder: 7 }), { db: t.db })).toEqual(
      {
        ok: true,
        id: created.id,
        created: false,
      },
    );
    expect(await getRequirement(kwarcab(), created.id, t.db)).toMatchObject({ title: 'Judul baru', sortOrder: 7 });
    expect(await saveRequirement(kwarcab(), crypto.randomUUID(), input({ code: 'BARU' }), { db: t.db })).toEqual({
      ok: false,
      reason: 'tidak-ditemukan',
    });
  });

  it('validasi server menolak kode berspasi, urutan negatif, dan jenis asing', () => {
    expect(RequirementSchema.safeParse({ ...input(), code: 'ada spasi' }).success).toBe(false);
    expect(RequirementSchema.safeParse({ ...input(), sortOrder: '-1' }).success).toBe(false);
    expect(RequirementSchema.safeParse({ ...input(), kind: 'SKX' }).success).toBe(false);
    expect(RequirementSchema.safeParse({ ...input(), title: '   ' }).success).toBe(false);
    const ok = RequirementSchema.safeParse({ ...input(), code: ' demo-pg-ramu-03 ', sortOrder: '3', description: '' });
    expect(ok.success && ok.data).toMatchObject({ code: 'DEMO-PG-RAMU-03', sortOrder: 3, description: null });
  });

  it('golongan terkunci setelah syarat pernah diverifikasi; filter status & golongan bekerja', async () => {
    expect((await verifyRequirement(staffA(), memberA, req.R1, null, { now: NOW, db: t.db })).ok).toBe(true);
    expect(await saveRequirement(kwarcab(), req.R1, input({ code: 'R1', golongan: 'PENEGAK' }), { db: t.db })).toEqual({
      ok: false,
      reason: 'golongan-terkunci',
    });
    expect((await saveRequirement(kwarcab(), req.R2, input({ code: 'R2', golongan: 'PENEGAK' }), { db: t.db })).ok).toBe(true);

    const active = await listRequirements(kwarcab(), { golongan: 'PENGGALANG', kind: 'SKU' }, t.db);
    expect(active.rows.map((x) => x.code)).toEqual(['R1', 'R3', 'K1']);
    expect(active.rows.find((x) => x.code === 'R1')?.verifiedCount).toBe(1);
    const off = await listRequirements(kwarcab(), { status: 'nonaktif' }, t.db);
    expect(off.rows.map((x) => x.code)).toEqual(['R-OFF']);
  });
});

describe('verifikasi syarat anggota (competency.verify + cakupan)', () => {
  it('IDOR: staf gudep/kwarran lain, admin website, dan peserta tidak bisa memverifikasi', async () => {
    for (const a of [staffB(), kwarran2(), actor('ADMIN_WEBSITE'), pesertaA(), actor('STAFF_GUDEP'), actor('STAFF_KWARRAN')]) {
      expect(await verifyRequirement(a, memberA, req.R1, null, { now: NOW, db: t.db })).toEqual({ ok: false, reason: 'tidak-ditemukan' });
    }
    expect(await verifications(memberA)).toHaveLength(0);
    // Kwarran satu meliputi gudep A & B; kwarcab meliputi semuanya.
    expect((await verifyRequirement(kwarran1(), memberB, req.R1, null, { now: NOW, db: t.db })).ok).toBe(true);
    expect((await verifyRequirement(kwarcab(), memberC, req.R1, null, { now: NOW, db: t.db })).ok).toBe(true);
    expect(await verifyRequirement(kwarran1(), memberC, req.R2, null, { now: NOW, db: t.db })).toEqual({
      ok: false,
      reason: 'tidak-ditemukan',
    });
  });

  it('menolak syarat nonaktif, golongan lain, anggota diarsipkan, dan verifikasi ganda', async () => {
    expect(await verifyRequirement(staffA(), memberA, req['R-OFF'], null, { now: NOW, db: t.db })).toEqual({
      ok: false,
      reason: 'tidak-berlaku',
    });
    expect(await verifyRequirement(staffA(), memberA, req.SG1, null, { now: NOW, db: t.db })).toEqual({
      ok: false,
      reason: 'tidak-berlaku',
    });
    expect(await verifyRequirement(staffA(), memberA, crypto.randomUUID(), null, { now: NOW, db: t.db })).toEqual({
      ok: false,
      reason: 'tidak-berlaku',
    });
    expect(await verifyRequirement(staffA(), archived, req.R1, null, { now: NOW, db: t.db })).toEqual({ ok: false, reason: 'nonaktif' });
    expect(await verifyRequirement(staffA(), memberA, req.R1, 'Praktik di latihan rutin', { now: NOW, db: t.db })).toEqual({
      ok: true,
      intent: 'verify',
      code: 'R1',
      title: 'Ramu satu',
    });
    expect(await verifyRequirement(kwarran1(), memberA, req.R1, null, { now: NOW, db: t.db })).toEqual({ ok: false, reason: 'sudah' });
    const [row] = await verifications(memberA);
    expect(row).toMatchObject({ verifiedByName: 'Kak Pembina A', note: 'Praktik di latihan rutin', revokedAt: null });
  });

  it('pembatalan: hanya dalam cakupan; verifikasi ulang memakai baris yang sama', async () => {
    await verifyRequirement(staffA(), memberA, req.R1, 'catatan awal', { now: NOW, db: t.db });
    expect(await revokeVerification(staffB(), memberA, req.R1, null, { now: NOW, db: t.db })).toEqual({
      ok: false,
      reason: 'tidak-ditemukan',
    });
    expect(await revokeVerification(kwarran2(), memberA, req.R1, null, { now: NOW, db: t.db })).toEqual({
      ok: false,
      reason: 'tidak-ditemukan',
    });
    expect((await verifications(memberA))[0].revokedAt).toBeNull();

    const later = new Date(NOW.getTime() + 3600_000);
    expect((await revokeVerification(kwarran1(), memberA, req.R1, 'Salah anggota', { now: later, db: t.db })).ok).toBe(true);
    expect(await revokeVerification(kwarran1(), memberA, req.R1, null, { now: later, db: t.db })).toEqual({ ok: false, reason: 'belum' });
    expect(await revokeVerification(staffA(), memberA, req.R2, null, { now: later, db: t.db })).toEqual({ ok: false, reason: 'belum' });
    let [row] = await verifications(memberA);
    expect(row).toMatchObject({ revokedByName: 'Kak Kwarran Satu', note: 'Salah anggota' });
    expect(row.revokedAt?.toISOString()).toBe(later.toISOString());

    const again = new Date(later.getTime() + 3600_000);
    expect((await verifyRequirement(staffA(), memberA, req.R1, null, { now: again, db: t.db })).ok).toBe(true);
    const rows = await verifications(memberA);
    expect(rows).toHaveLength(1);
    [row] = rows;
    expect(row).toMatchObject({ revokedAt: null, revokedByName: null, note: null, verifiedByName: 'Kak Pembina A' });
    expect(row.verifiedAt.toISOString()).toBe(again.toISOString());
  });

  it('peserta pemilik akun mendapat notifikasi tanpa catatan pembina', async () => {
    await verifyRequirement(staffA(), memberA, req.R1, 'Catatan internal pembina', { now: NOW, db: t.db });
    const notes = await t.db.select().from(schema.notifications).where(eq(schema.notifications.userId, pesertaUserA));
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({ href: '/dashboard/profil', body: 'R1 — Ramu satu' });
    expect(JSON.stringify(notes[0])).not.toContain('Catatan internal');
  });
});

describe('kemajuan SKU/SKK', () => {
  it('menghitung per jenis + tingkatan; syarat nonaktif & verifikasi dibatalkan tidak dihitung', async () => {
    await t.db.insert(schema.memberCompetencies).values([
      { memberId: memberA, requirementId: req.R1, verifiedByName: 'Kak A', verifiedAt: NOW },
      { memberId: memberA, requirementId: req.R2, verifiedByName: 'Kak A', verifiedAt: NOW, revokedAt: NOW, revokedByName: 'Kak B' },
      // Verifikasi lama untuk syarat yang kemudian dinonaktifkan: tidak ikut dihitung.
      { memberId: memberA, requirementId: req['R-OFF'], verifiedByName: 'Kak A', verifiedAt: NOW },
      { memberId: memberA, requirementId: req.S1, verifiedByName: 'Kak A', verifiedAt: NOW },
    ]);
    const p = await memberProgress(staffA(), memberA, t.db);
    expect(p?.groups.map((g) => [g.kind, g.level, g.verified, g.total, g.percent])).toEqual([
      ['SKU', 'Ramu', 1, 3, 33],
      ['SKU', 'Rakit', 0, 1, 0],
      ['SKK', 'Pengamat Burung', 1, 1, 100],
    ]);
    const ramu = p!.groups[0];
    expect(ramu.items.find((i) => i.requirement.code === 'R2')).toMatchObject({ verified: null, revoked: { byName: 'Kak B' } });
    expect(p?.canVerify).toBe(true);

    // Menonaktifkan syarat yang sudah diverifikasi mengurangi pembilang DAN penyebut.
    await setRequirementActive(kwarcab(), req.R1, false, { db: t.db });
    const after = await memberProgress(staffA(), memberA, t.db);
    expect(after?.groups[0]).toMatchObject({ level: 'Ramu', verified: 0, total: 2 });
  });

  it('peserta hanya melihat dirinya sendiri, hanya-baca, tanpa catatan pembina', async () => {
    await verifyRequirement(staffA(), memberA, req.R1, 'Catatan internal', { now: NOW, db: t.db });
    const own = await memberProgress(pesertaA(), memberA, t.db);
    expect(own).toMatchObject({ self: true, canVerify: false });
    expect(own?.groups[0].verified).toBe(1);
    expect(own?.groups[0].items[0].verified).toMatchObject({ byName: 'Kak Pembina A', note: null });

    expect(await memberProgress(pesertaA(), memberB, t.db)).toBeNull();
    expect(await memberProgress(actor('PESERTA', { memberId: null }), memberA, t.db)).toBeNull();
    expect(await memberProgress(actor('ADMIN_WEBSITE'), memberA, t.db)).toBeNull();
    expect(await memberProgress(staffB(), memberA, t.db)).toBeNull();
    expect(await memberProgress(kwarran2(), memberA, t.db)).toBeNull();
    expect((await memberProgress(staffA(), memberA, t.db))?.groups[0].items[0].verified?.note).toBe('Catatan internal');
  });

  it('anggota diarsipkan tetap terlihat staf tetapi tidak bisa diverifikasi', async () => {
    const p = await memberProgress(staffA(), archived, t.db);
    expect(p).not.toBeNull();
    expect(p?.canVerify).toBe(false);
  });
});

describe('ekspor rekap kemajuan (cakupan)', () => {
  const namesIn = (csv: string) =>
    [
      ...new Set(
        parseCsv(csv)
          .slice(1)
          .map((r) => r[1]),
      ),
    ].sort();

  it('hanya pemegang competency.verify; gudep di luar cakupan = tidak ditemukan', async () => {
    expect(await progressExport(actor('ADMIN_WEBSITE'), {}, { db: t.db })).toBeNull();
    expect(await progressExport(pesertaA(), {}, { db: t.db })).toBeNull();
    expect(await progressExport(staffA(), { gudepId: gudepB }, { db: t.db })).toBeNull();
    expect(await progressExport(kwarran1(), { gudepId: gudepC }, { db: t.db })).toBeNull();
    expect(await progressExport(staffA(), { gudepId: 'bukan-uuid' }, { db: t.db })).toBeNull();
    expect(await progressExport(staffA(), { gudepId: crypto.randomUUID() }, { db: t.db })).toBeNull();
  });

  it('isi sesuai cakupan; arsip tidak ikut; kemajuan benar', async () => {
    await verifyRequirement(staffA(), memberA, req.R1, 'Catatan rahasia', { now: NOW, db: t.db });
    await verifyRequirement(staffA(), memberA, req.R2, null, { now: NOW, db: t.db });

    const a = await progressExport(staffA(), {}, { db: t.db });
    expect(namesIn(a!.csv)).toEqual(['Anggota A']);
    expect(a!.memberCount).toBe(1);
    const k = await progressExport(kwarran1(), {}, { db: t.db });
    expect(namesIn(k!.csv)).toEqual(['Anggota A', 'Anggota B']);
    const kb = await progressExport(kwarran1(), { gudepId: gudepB }, { db: t.db });
    expect(namesIn(kb!.csv)).toEqual(['Anggota B']);
    expect(kb!.gudep?.name).toBe('Gudep B');
    const all = await progressExport(kwarcab(), {}, { db: t.db });
    expect(namesIn(all!.csv)).toEqual(['Anggota A', 'Anggota B', 'Anggota C']);

    const rows = parseCsv(a!.csv);
    expect(rows[0]).toContain('Persentase');
    const ramu = rows.find((r) => r[1] === 'Anggota A' && r[7] === 'Ramu');
    expect(ramu?.slice(6)).toEqual(['SKU', 'Ramu', '2', '3', '66%', '2026-10-10']);
    expect(a!.csv).not.toContain('Catatan rahasia');
  });

  it('aman dari injeksi formula', async () => {
    await t.db.update(schema.members).set({ fullName: '=HYPERLINK("http://x")' }).where(eq(schema.members.id, memberA));
    const out = await progressExport(staffA(), { gudepId: gudepA }, { db: t.db });
    expect(out!.csv).toContain(`"'=HYPERLINK(""http://x"")"`);
    expect(out!.csv.split('\r\n').some((line) => line.startsWith('='))).toBe(false);
  });

  it('staf tanpa penugasan gudep tidak mendapat data siapa pun', async () => {
    const out = await progressExport(actor('STAFF_GUDEP'), {}, { db: t.db });
    expect(out?.memberCount).toBe(0);
    expect(parseCsv(out!.csv)).toHaveLength(1);
    expect(await progressExport(actor('STAFF_KWARRAN'), { gudepId: gudepA }, { db: t.db })).toBeNull();
  });
});

describe('jalur formulir Server Action (Zod di server)', () => {
  const requirementForm = (over: Record<string, string> = {}) =>
    form({ kind: 'SKU', golongan: 'PENGGALANG', level: 'Ramu', code: 'demo-pg-ramu-09', title: 'Contoh syarat', sortOrder: '9', ...over });

  it('simpan syarat: peran lain ditolak sebelum validasi; isian salah dikembalikan per kolom', async () => {
    expect(await saveRequirementForm(staffA(), null, requirementForm(), { db: t.db })).toEqual({ ok: false, reason: 'tidak-ditemukan' });
    const bad = await saveRequirementForm(kwarcab(), null, requirementForm({ code: 'ada spasi', title: '  ', kind: 'SKX' }), { db: t.db });
    expect(bad.ok).toBe(false);
    if (bad.ok || bad.reason !== 'tidak-valid') throw new Error('harus tidak-valid');
    expect(Object.keys(bad.errors).sort()).toEqual(['code', 'kind', 'title']);

    const created = await saveRequirementForm(kwarcab(), null, requirementForm({ description: '' }), { db: t.db });
    expect(created).toMatchObject({ ok: true, created: true });
    if (!created.ok) return;
    expect(await getRequirement(kwarcab(), created.id, t.db)).toMatchObject({ code: 'DEMO-PG-RAMU-09', sortOrder: 9, description: null });
    expect(await saveRequirementForm(kwarcab(), null, requirementForm({ code: 'DEMO-PG-RAMU-09' }), { db: t.db })).toEqual({
      ok: false,
      reason: 'kode-dipakai',
    });
  });

  it('verifikasi lewat formulir: intent & catatan divalidasi; IDOR tetap ditolak', async () => {
    const bad = await verificationForm(staffA(), memberA, req.R1, form({ intent: 'hapus' }), { now: NOW, db: t.db });
    expect(bad).toMatchObject({ ok: false, reason: 'tidak-valid' });
    const long = await verificationForm(staffA(), memberA, req.R1, form({ intent: 'verify', note: 'x'.repeat(301) }), {
      now: NOW,
      db: t.db,
    });
    expect(long.ok === false && long.errors?.note).toBeTruthy();
    expect(await verifications(memberA)).toHaveLength(0);

    for (const a of [staffB(), kwarran2(), pesertaA(), actor('ADMIN_WEBSITE')]) {
      expect(await verificationForm(a, memberA, req.R1, form({ intent: 'verify' }), { now: NOW, db: t.db })).toMatchObject({
        ok: false,
        reason: 'tidak-ditemukan',
      });
    }
    expect(await verifications(memberA)).toHaveLength(0);

    expect(
      await verificationForm(staffA(), memberA, req.R1, form({ intent: 'verify', note: '  Praktik tali-temali  ' }), {
        now: NOW,
        db: t.db,
      }),
    ).toEqual({ ok: true, intent: 'verify', code: 'R1', title: 'Ramu satu' });
    expect((await verifications(memberA))[0]).toMatchObject({ note: 'Praktik tali-temali', revokedAt: null });
    expect(await verificationForm(kwarran1(), memberA, req.R1, form({ intent: 'revoke', note: '' }), { now: NOW, db: t.db })).toMatchObject(
      {
        ok: true,
        intent: 'revoke',
      },
    );
    expect((await verifications(memberA))[0]).toMatchObject({ note: null, revokedByName: 'Kak Kwarran Satu' });
  });
});

describe('log audit SKU/SKK', () => {
  it('setiap penulisan & ekspor tercatat, tanpa nama anggota dan tanpa catatan pembina', async () => {
    const created = await saveRequirement(kwarcab(), null, input({ code: 'AUDIT-1' }), { db: t.db, ip: '203.0.113.9' });
    if (!created.ok) throw new Error('gagal membuat');
    await saveRequirement(kwarcab(), created.id, input({ code: 'AUDIT-1', title: 'Diubah' }), { db: t.db });
    await setRequirementActive(kwarcab(), created.id, false, { db: t.db });
    await verifyRequirement(staffA(), memberA, req.R1, 'Catatan rahasia pembina', { now: NOW, db: t.db });
    await revokeVerification(staffA(), memberA, req.R1, 'Alasan rahasia', { now: NOW, db: t.db });
    await progressExport(staffA(), { gudepId: gudepA }, { db: t.db });
    // Ditolak = tidak tercatat sebagai aksi berhasil.
    await verifyRequirement(staffB(), memberA, req.R2, null, { now: NOW, db: t.db });

    const rows = await auditRows();
    expect(rows.map((x) => x.action)).toEqual([
      'competency.requirement_created',
      'competency.requirement_updated',
      'competency.requirement_deactivated',
      'competency.verified',
      'competency.revoked',
      'competency.export',
    ]);
    expect(rows[0]).toMatchObject({ entityType: 'competency_requirement', entityId: created.id, ip: '203.0.113.9' });
    expect(rows[3]).toMatchObject({
      entityType: 'member',
      entityId: memberA,
      actorName: 'Kak Pembina A',
      summary: 'Memverifikasi syarat SKU R1',
    });
    expect(rows[4].summary).toBe('Membatalkan verifikasi syarat SKU R1');
    expect(rows[5]).toMatchObject({ entityType: 'gudep', entityId: gudepA });
    const all = JSON.stringify(rows);
    for (const secret of ['Anggota A', 'Catatan rahasia', 'Alasan rahasia']) expect(all).not.toContain(secret);
  });
});

describe('peserta & anggota dianonimkan', () => {
  it('peserta: hanya lewat akunnya sendiri; verifikasi yang dibatalkan & catatannya tidak terlihat', async () => {
    await verifyRequirement(staffA(), memberA, req.R1, null, { now: NOW, db: t.db });
    await verifyRequirement(staffA(), memberA, req.R2, 'Catatan awal', { now: NOW, db: t.db });
    await revokeVerification(staffA(), memberA, req.R2, 'Salah catat rahasia', { now: NOW, db: t.db });

    const own = await ownProgress(pesertaA(), t.db);
    expect(own?.self).toBe(true);
    const ramu = own!.groups[0];
    expect(ramu).toMatchObject({ verified: 1, total: 3 });
    expect(ramu.items.find((i) => i.requirement.code === 'R2')).toMatchObject({ verified: null, revoked: null });
    expect(JSON.stringify(own)).not.toContain('Salah catat');
    // Staf dalam cakupan tetap melihat riwayat pembatalan beserta alasannya.
    const staff = await memberProgress(staffA(), memberA, t.db);
    expect(staff!.groups[0].items.find((i) => i.requirement.code === 'R2')?.revoked).toMatchObject({ note: 'Salah catat rahasia' });

    expect(await ownProgress(staffA(), t.db)).toBeNull();
    expect(await ownProgress(actor('PESERTA', { memberId: null }), t.db)).toBeNull();
    expect(await ownProgress(actor('PESERTA', { memberId: 'bukan-uuid' }), t.db)).toBeNull();
  });

  it('anggota dianonimkan: catatan disembunyikan, tidak bisa diverifikasi, tidak terlihat sebagai profil sendiri', async () => {
    await verifyRequirement(staffA(), memberA, req.R1, 'Ibu S. menelepon', { now: NOW, db: t.db });
    await t.db.update(schema.members).set({ anonymizedAt: NOW, status: 'ARCHIVED' }).where(eq(schema.members.id, memberA));

    const p = await memberProgress(kwarcab(), memberA, t.db);
    expect(p?.canVerify).toBe(false);
    expect(p?.groups[0].items[0].verified).toMatchObject({ note: null });
    expect(JSON.stringify(p)).not.toContain('Ibu S.');
    expect(await verifyRequirement(kwarcab(), memberA, req.R2, null, { now: NOW, db: t.db })).toEqual({
      ok: false,
      reason: 'tidak-ditemukan',
    });
    expect(await revokeVerification(kwarcab(), memberA, req.R1, null, { now: NOW, db: t.db })).toEqual({
      ok: false,
      reason: 'tidak-ditemukan',
    });
    expect(await ownProgress(pesertaA(), t.db)).toBeNull();
  });

  it('ekspor memberi nama berkas tanpa nama gudep/anggota', async () => {
    const out = await progressExport(staffA(), { gudepId: gudepA }, { db: t.db, now: NOW });
    expect(out?.filename).toBe(`rekap-sku-skk-gudep-${gudepA.slice(0, 8)}-2026-10-10.csv`);
    expect((await progressExport(kwarcab(), {}, { db: t.db, now: NOW }))?.filename).toBe('rekap-sku-skk-cakupan-2026-10-10.csv');
  });
});
