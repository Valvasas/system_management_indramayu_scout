/**
 * Masa jabatan (2.4) pada SQL sungguhan: filter "sedang menjabat" situs publik (batas tanggal WIB,
 * data lama tanpa tanggal), validasi & izin CMS pengurus, penugasan staf (izin users.manage,
 * IDOR antar-akun, tidak mengubah akses), dan pengingat berakhir (jendela 30 hari + dedupe).
 */
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { schema } from '@/db';
import type { Role } from '@/db/schema';
import { addAssignment, endAssignment, listAssignments } from '@/features/terms/assignments';
import { boardOverview, deleteBoardMember, saveBoardMember } from '@/features/terms/board';
import { sendTermReminders } from '@/features/terms/reminders';
import { ASSIGNMENT_FIELDS } from '@/features/terms/validation';
import { getOrganizationByDepartment, getOrganizationMembers } from '@/lib/repositories/organization';
import { createTestDb, type TestDb } from '../helpers/test-db';
import { actor } from '../helpers/actors';

let t: TestDb;

/** 08.00 WIB, 12 Oktober 2026. */
const NOW = new Date('2026-10-12T01:00:00Z');

const fd = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};

const board = (name: string, over: Partial<typeof schema.boardMembers.$inferInsert> = {}) => ({
  name,
  position: `Jabatan ${name}`,
  department: 'Pimpinan',
  period: '2026–2031',
  ...over,
});

async function makeUser(username: string, role: Role, over: Partial<typeof schema.users.$inferInsert> = {}) {
  const [u] = await t.db
    .insert(schema.users)
    .values({ username, name: `Kak ${username}`, passwordHash: 'x', role, ...over })
    .returning();
  return u;
}

beforeEach(async () => {
  t = await createTestDb();
});
afterEach(async () => {
  await t.close();
});

describe('situs publik hanya menampilkan pengurus yang sedang menjabat', () => {
  it('aktif DAN (berakhir kosong ATAU ≥ hari ini WIB) DAN sudah mulai', async () => {
    await t.db
      .insert(schema.boardMembers)
      .values([
        board('Lama Tanpa Tanggal'),
        board('Berakhir Hari Ini', { termStart: '2021-10-12', termEnd: '2026-10-12' }),
        board('Berakhir Kemarin', { termStart: '2021-10-11', termEnd: '2026-10-11' }),
        board('Dinonaktifkan', { termEnd: '2030-01-01', isActive: false }),
        board('Mulai Besok', { termStart: '2026-10-13', termEnd: '2031-10-12' }),
        board('Berjalan', { termStart: '2026-01-01', termEnd: null }),
      ]);
    const names = (await getOrganizationMembers(NOW, t.db)).map((m) => m.name).sort();
    expect(names).toEqual(['Berakhir Hari Ini', 'Berjalan', 'Lama Tanpa Tanggal']);
  });

  it('pergantian hari mengikuti WIB: 23.59 WIB masih tampil, 00.00 WIB (UTC masih kemarin) sudah tidak', async () => {
    await t.db.insert(schema.boardMembers).values(board('Hari Terakhir 11 Okt', { termEnd: '2026-10-11' }));
    const at = async (iso: string) => (await getOrganizationMembers(new Date(iso), t.db)).length;
    expect(await at('2026-10-11T16:59:59Z')).toBe(1); // 23.59.59 WIB, 11 Okt
    expect(await at('2026-10-11T17:00:00Z')).toBe(0); // 00.00 WIB, 12 Okt — tanggal UTC masih 11 Okt
  });

  it('baris lama yang disisipkan tanpa kolom masa jabatan tetap tampil (default aman)', async () => {
    const [row] = await t.db
      .insert(schema.boardMembers)
      .values({ name: 'Kak Warisan', position: 'Bendahara', department: 'Pimpinan', period: '2024–2029' })
      .returning();
    expect(row).toMatchObject({ isActive: true, termStart: null, termEnd: null });
    const groups = await getOrganizationByDepartment(NOW, t.db);
    expect(groups).toEqual([{ department: 'Pimpinan', members: [expect.objectContaining({ name: 'Kak Warisan', role: 'Bendahara' })] }]);
  });
});

describe('CMS pengurus: validasi, izin, ringkasan', () => {
  const base = { name: 'Kak Uji', position: 'Sekretaris', department: 'Pimpinan', period: '2026–2031', sortOrder: '2' };

  it('tanggal berakhir sebelum tanggal mulai ditolak di server dan tidak menyimpan apa pun', async () => {
    const r = await saveBoardMember(
      actor('ADMIN_WEBSITE'),
      null,
      fd({ ...base, termStart: '2026-05-01', termEnd: '2026-04-30', isActive: 'on' }),
      t.db,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.state.errors?.termEnd).toMatch(/tidak boleh sebelum/);
    expect(await t.db.select().from(schema.boardMembers)).toHaveLength(0);
  });

  it('hanya pemegang content.manage yang bisa menulis', async () => {
    for (const role of ['STAFF_KWARRAN', 'STAFF_GUDEP', 'PESERTA'] as Role[]) {
      const r = await saveBoardMember(actor(role), null, fd({ ...base, isActive: 'on' }), t.db);
      expect(r.ok).toBe(false);
    }
    const [row] = await t.db.insert(schema.boardMembers).values(board('Kak Tetap')).returning();
    expect(await deleteBoardMember(actor('STAFF_KWARRAN'), row.id, t.db)).toEqual({ ok: false, reason: 'tidak-diizinkan' });
    expect(await boardOverview(actor('STAFF_GUDEP'), NOW, t.db)).toBeNull();
    expect(await t.db.select().from(schema.boardMembers)).toHaveLength(1);
  });

  it('menyimpan masa jabatan; kosong → null; id asing → tidak ditemukan', async () => {
    const created = await saveBoardMember(
      actor('ADMIN_WEBSITE'),
      null,
      fd({ ...base, termStart: '2026-01-01', termEnd: '', isActive: 'on' }),
      t.db,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const [row] = await t.db.select().from(schema.boardMembers).where(eq(schema.boardMembers.id, created.id));
    expect(row).toMatchObject({ termStart: '2026-01-01', termEnd: null, isActive: true, sortOrder: 2 });

    // Kotak "masih menjabat" tidak dicentang → nonaktif (pindah ke riwayat).
    const updated = await saveBoardMember(
      actor('ADMIN_KWARCAB'),
      created.id,
      fd({ ...base, termStart: '2026-01-01', termEnd: '2026-10-01' }),
      t.db,
    );
    expect(updated.ok).toBe(true);
    const [after] = await t.db.select().from(schema.boardMembers).where(eq(schema.boardMembers.id, created.id));
    expect(after).toMatchObject({ termEnd: '2026-10-01', isActive: false });

    const ghost = await saveBoardMember(actor('ADMIN_WEBSITE'), crypto.randomUUID(), fd({ ...base, isActive: 'on' }), t.db);
    expect(ghost.ok).toBe(false);
    expect(await t.db.select().from(schema.boardMembers)).toHaveLength(1);
  });

  it('ringkasan: hampir berakhir (≤ 30 hari) dan riwayat periode', async () => {
    await t.db
      .insert(schema.boardMembers)
      .values([
        board('Tanpa Tanggal'),
        board('Sisa 30 Hari', { termEnd: '2026-11-11' }),
        board('Sisa 31 Hari', { termEnd: '2026-11-12' }),
        board('Belum Mulai', { termStart: '2026-12-01' }),
        board('Lewat', { termStart: '2021-01-01', termEnd: '2026-01-01' }),
        board('Nonaktif', { isActive: false }),
      ]);
    const o = await boardOverview(actor('ADMIN_WEBSITE'), NOW, t.db);
    expect(o).not.toBeNull();
    expect(o!.today).toBe('2026-10-12');
    expect(o!.ending.map((r) => [r.name, r.daysLeft])).toEqual([['Sisa 30 Hari', 30]]);
    expect(o!.current.map((r) => r.name).sort()).toEqual(['Belum Mulai', 'Sisa 30 Hari', 'Sisa 31 Hari', 'Tanpa Tanggal']);
    expect(o!.past.map((r) => r.name)).toEqual(['Lewat', 'Nonaktif']);
  });
});

describe('penugasan staf (informasional, users.manage)', () => {
  let ids: { kwarran: string; gudep: string; otherGudep: string };

  beforeEach(async () => {
    const [k1, k2] = await t.db
      .insert(schema.kwarran)
      .values([{ name: 'Kwarran Satu' }, { name: 'Kwarran Dua' }])
      .returning();
    const [g1, g2] = await t.db
      .insert(schema.gudep)
      .values([
        { kwarranId: k1.id, name: 'Gudep Satu' },
        { kwarranId: k2.id, name: 'Gudep Dua' },
      ])
      .returning();
    ids = { kwarran: k1.id, gudep: g1.id, otherGudep: g2.id };
  });

  /** Formulir penugasan dengan nama kolom sebenarnya (berawalan, lihat ASSIGNMENT_FIELDS). */
  const assignment = (over: Partial<Record<keyof typeof ASSIGNMENT_FIELDS, string>> = {}) => {
    const v = {
      position: 'Pembina Gudep',
      role: 'STAFF_GUDEP',
      gudepId: ids.otherGudep,
      termStart: '2026-07-01',
      termEnd: '2027-06-30',
      ...over,
    };
    return fd(
      Object.fromEntries(Object.entries(v).map(([k, val]) => [ASSIGNMENT_FIELDS[k as keyof typeof ASSIGNMENT_FIELDS], val as string])),
    );
  };

  it('hanya pemegang users.manage; peran lain mendapat "tidak ditemukan"', async () => {
    const target = await makeUser('pembina.satu', 'STAFF_GUDEP', { gudepId: ids.gudep, kwarranId: ids.kwarran });
    for (const role of ['ADMIN_WEBSITE', 'STAFF_KWARRAN', 'STAFF_GUDEP', 'PESERTA'] as Role[]) {
      const a = actor(role, { kwarranId: ids.kwarran, gudepId: ids.gudep });
      expect(await listAssignments(a, target.id, NOW, t.db)).toBeNull();
      const r = await addAssignment(a, target.id, assignment(), t.db);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.state.message).toBe('Akun tidak ditemukan.');
    }
    expect(await t.db.select().from(schema.staffAssignments)).toHaveLength(0);
    expect(await addAssignment(actor('ADMIN_KWARCAB'), target.id, assignment(), t.db)).toMatchObject({ ok: true });
  });

  it('akun peserta & Super Admin (bagi non-Super Admin) di luar jangkauan; peran Super Admin hanya oleh Super Admin', async () => {
    const peserta = await makeUser('peserta.satu', 'PESERTA');
    const superAdmin = await makeUser('super.satu', 'SUPER_ADMIN');
    const staff = await makeUser('staf.satu', 'STAFF_KWARRAN', { kwarranId: ids.kwarran });
    const kwarcab = actor('ADMIN_KWARCAB');
    expect(await listAssignments(kwarcab, peserta.id, NOW, t.db)).toBeNull();
    expect(await listAssignments(kwarcab, superAdmin.id, NOW, t.db)).toBeNull();
    expect((await addAssignment(kwarcab, superAdmin.id, assignment({ role: 'ADMIN_KWARCAB', position: 'Ketua' }), t.db)).ok).toBe(false);
    const escalate = await addAssignment(kwarcab, staff.id, assignment({ role: 'SUPER_ADMIN', position: 'Admin' }), t.db);
    expect(escalate.ok).toBe(false);
    if (!escalate.ok) expect(escalate.state.errors?.[ASSIGNMENT_FIELDS.role]).toBeDefined();
    expect(await listAssignments(actor('SUPER_ADMIN'), superAdmin.id, NOW, t.db)).toEqual([]);
    expect(
      (await addAssignment(actor('SUPER_ADMIN'), superAdmin.id, assignment({ role: 'SUPER_ADMIN', position: 'Admin' }), t.db)).ok,
    ).toBe(true);
  });

  it('tidak pernah mengubah wilayah, peran, atau status akun; kwarran diturunkan dari gudep', async () => {
    const target = await makeUser('pembina.dua', 'STAFF_GUDEP', { gudepId: ids.gudep, kwarranId: ids.kwarran });
    const before = await t.db.select().from(schema.users).where(eq(schema.users.id, target.id));
    // Kwarran kiriman formulir diabaikan untuk penugasan gudep: diturunkan dari gudep yang dipilih.
    const r = await addAssignment(actor('ADMIN_KWARCAB'), target.id, assignment({ kwarranId: ids.kwarran }), t.db);
    expect(r.ok).toBe(true);
    const [after] = await t.db.select().from(schema.users).where(eq(schema.users.id, target.id));
    expect({ role: after.role, gudepId: after.gudepId, kwarranId: after.kwarranId, active: after.active }).toEqual({
      role: before[0].role,
      gudepId: ids.gudep,
      kwarranId: ids.kwarran,
      active: true,
    });
    const [row] = await t.db.select().from(schema.staffAssignments);
    expect(row).toMatchObject({ gudepId: ids.otherGudep, isActive: true, termStart: '2026-07-01', termEnd: '2027-06-30' });
    const [g2] = await t.db.select().from(schema.gudep).where(eq(schema.gudep.id, ids.otherGudep));
    expect(row.kwarranId).toBe(g2.kwarranId);
    expect(row.kwarranId).not.toBe(ids.kwarran);
  });

  it('validasi server: berakhir < mulai, wilayah wajib, gudep tak dikenal', async () => {
    const target = await makeUser('pembina.tiga', 'STAFF_GUDEP');
    const kwarcab = actor('ADMIN_KWARCAB');
    const backwards = await addAssignment(kwarcab, target.id, assignment({ termEnd: '2026-06-30' }), t.db);
    expect(backwards.ok).toBe(false);
    if (!backwards.ok) expect(backwards.state.errors?.[ASSIGNMENT_FIELDS.termEnd]).toMatch(/tidak boleh sebelum/);
    const noKwarran = await addAssignment(kwarcab, target.id, assignment({ role: 'STAFF_KWARRAN', kwarranId: '' }), t.db);
    if (!noKwarran.ok) expect(noKwarran.state.errors?.[ASSIGNMENT_FIELDS.kwarranId]).toBeDefined();
    const unknown = await addAssignment(kwarcab, target.id, assignment({ gudepId: crypto.randomUUID() }), t.db);
    expect(unknown.ok).toBe(false);
    if (!unknown.ok) expect(unknown.state.errors?.[ASSIGNMENT_FIELDS.gudepId]).toBe('Gudep tidak ditemukan.');
    expect(noKwarran.ok).toBe(false);
    expect(await t.db.select().from(schema.staffAssignments)).toHaveLength(0);
  });

  it('mengakhiri penugasan: hanya lewat akun pemiliknya (IDOR), tanggal WIB, tidak bisa dua kali', async () => {
    const owner = await makeUser('pembina.empat', 'STAFF_GUDEP');
    const other = await makeUser('pembina.lima', 'STAFF_GUDEP');
    const kwarcab = actor('ADMIN_KWARCAB');
    const added = await addAssignment(kwarcab, owner.id, assignment({ termStart: '2026-01-01', termEnd: '' }), t.db);
    expect(added.ok).toBe(true);
    if (!added.ok) return;

    // Id penugasan milik akun lain → tidak ditemukan, baris tidak berubah.
    expect(await endAssignment(kwarcab, other.id, added.id, NOW, t.db)).toEqual({ ok: false, reason: 'tidak-ditemukan' });
    expect(await endAssignment(actor('ADMIN_WEBSITE'), owner.id, added.id, NOW, t.db)).toEqual({ ok: false, reason: 'tidak-ditemukan' });
    expect(await listAssignments(kwarcab, other.id, NOW, t.db)).toEqual([]);
    let [row] = await t.db.select().from(schema.staffAssignments);
    expect(row).toMatchObject({ isActive: true, termEnd: null });

    // 00.30 WIB 13 Okt = 17.30 UTC 12 Okt: tanggal berakhir mengikuti WIB, bukan UTC.
    expect(await endAssignment(kwarcab, owner.id, added.id, new Date('2026-10-12T17:30:00Z'), t.db)).toEqual({
      ok: true,
      position: 'Pembina Gudep',
      termEnd: '2026-10-13',
    });
    [row] = await t.db.select().from(schema.staffAssignments);
    expect(row).toMatchObject({ isActive: false, termEnd: '2026-10-13' });
    expect(await endAssignment(kwarcab, owner.id, added.id, NOW, t.db)).toEqual({ ok: false, reason: 'sudah-berakhir' });

    const list = await listAssignments(kwarcab, owner.id, NOW, t.db);
    expect(list).toHaveLength(1);
    expect(list![0]).toMatchObject({ state: 'ENDED', gudepName: 'Gudep Dua', position: 'Pembina Gudep' });
  });
});

describe('pengingat masa jabatan berakhir', () => {
  it('jendela 0–30 hari, penerima sesuai izin, dan dedupe (jalankan kedua tidak mengirim apa pun)', async () => {
    const admin = await makeUser('admin', 'SUPER_ADMIN');
    const kwarcab = await makeUser('kwarcab', 'ADMIN_KWARCAB');
    const humas = await makeUser('humas', 'ADMIN_WEBSITE');
    const [k] = await t.db.insert(schema.kwarran).values({ name: 'Kwarran Uji' }).returning();
    const staf = await makeUser('staf.kwarran', 'STAFF_KWARRAN', { kwarranId: k.id });
    const nonaktif = await makeUser('staf.nonaktif', 'STAFF_GUDEP', { active: false });

    const [dueBoard] = await t.db
      .insert(schema.boardMembers)
      .values([
        board('Berakhir 10 Hari', { termEnd: '2026-10-22' }),
        board('Berakhir 31 Hari', { termEnd: '2026-11-12' }),
        board('Sudah Berakhir', { termEnd: '2026-10-11' }),
        board('Nonaktif Hampir Berakhir', { termEnd: '2026-10-20', isActive: false }),
        board('Tanpa Tanggal'),
      ])
      .returning();
    const [dueStaff] = await t.db
      .insert(schema.staffAssignments)
      .values([
        {
          userId: staf.id,
          role: 'STAFF_KWARRAN',
          position: 'Andalan Kwarran',
          kwarranId: k.id,
          termStart: '2025-01-01',
          termEnd: '2026-11-11',
        },
        { userId: staf.id, role: 'STAFF_KWARRAN', position: 'Andalan Lama', termStart: '2024-01-01', termEnd: '2026-11-12' },
        { userId: nonaktif.id, role: 'STAFF_GUDEP', position: 'Pembina Nonaktif', termStart: '2025-01-01', termEnd: '2026-10-20' },
        {
          userId: staf.id,
          role: 'STAFF_KWARRAN',
          position: 'Sudah Diakhiri',
          termStart: '2025-01-01',
          termEnd: '2026-10-20',
          isActive: false,
        },
      ])
      .returning();

    const first = await sendTermReminders(NOW, t.db);
    // Pengurus → content.manage (admin, kwarcab, humas); penugasan → users.manage (admin, kwarcab).
    expect(first).toEqual({ boardDue: 1, staffDue: 1, sent: 5 });
    const rows = await t.db.select().from(schema.notifications);
    expect(rows.every((r) => r.kind === 'TERM_ENDING')).toBe(true);
    const boardRows = rows.filter((r) => r.dedupeKey === `term:board_members:${dueBoard.id}:2026-10-22`);
    expect(boardRows.map((r) => r.userId).sort()).toEqual([admin.id, kwarcab.id, humas.id].sort());
    expect(boardRows[0]).toMatchObject({ href: `/dashboard/konten/pengurus/${dueBoard.id}` });
    expect(boardRows[0].body).toContain('10 hari lagi');
    const staffRows = rows.filter((r) => r.dedupeKey === `term:staff_assignments:${dueStaff.id}:2026-11-11`);
    expect(staffRows.map((r) => r.userId).sort()).toEqual([admin.id, kwarcab.id].sort());
    expect(staffRows[0]).toMatchObject({ href: `/dashboard/pengguna/${staf.id}` });
    expect(rows.some((r) => r.userId === staf.id || r.userId === nonaktif.id)).toBe(false);

    // Dijalankan lagi (cron harian): tidak ada notifikasi baru.
    expect(await sendTermReminders(NOW, t.db)).toEqual({ boardDue: 1, staffDue: 1, sent: 0 });
    expect(await t.db.select().from(schema.notifications)).toHaveLength(5);

    // Tanggal berakhir diperpanjang lalu masuk jendela lagi → pengingat untuk tanggal baru.
    await t.db.update(schema.boardMembers).set({ termEnd: '2026-10-30' }).where(eq(schema.boardMembers.id, dueBoard.id));
    expect((await sendTermReminders(NOW, t.db)).sent).toBe(3);
  });

  it('hari terakhir mengikuti WIB dan tanpa jabatan dalam jendela tidak mengirim apa pun', async () => {
    await makeUser('kwarcab', 'ADMIN_KWARCAB');
    await t.db.insert(schema.boardMembers).values(board('Hari Terakhir', { termEnd: '2026-10-11' }));
    // 23.00 WIB 11 Okt: masih hari terakhir.
    const last = await sendTermReminders(new Date('2026-10-11T16:00:00Z'), t.db);
    expect(last).toEqual({ boardDue: 1, staffDue: 0, sent: 1 });
    const [n] = await t.db.select().from(schema.notifications);
    expect(n.body).toContain('hari ini hari terakhir');
    // 00.00 WIB 12 Okt: sudah lewat.
    expect(await sendTermReminders(new Date('2026-10-11T17:00:00Z'), t.db)).toEqual({ boardDue: 0, staffDue: 0, sent: 0 });
  });
});
