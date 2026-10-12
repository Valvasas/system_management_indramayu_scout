import { and, eq, like } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { schema } from '@/db';
import {
  attendanceOpensAt,
  attendanceSheet,
  exportAttendanceCsv,
  ownAttendanceHistory,
  recordAttendance,
  recordAttendanceForm,
  wibDateTime,
} from '@/features/attendance/attendance';
import { recapOf } from '@/features/attendance/labels';
import { parseCsv } from '@/lib/csv';
import { createTestDb, type TestDb } from '../helpers/test-db';
import { actor } from '../helpers/actors';

let t: TestDb;
const NOW = new Date('2026-10-06T08:00:00Z');
const ids = {} as Record<
  'k1' | 'k2' | 'gA' | 'gB' | 'gC' | 'mA1' | 'mA2' | 'mA3' | 'mB' | 'mC' | 'past' | 'future' | 'cancelled' | 'draft',
  string
>;

beforeEach(async () => {
  t = await createTestDb();
  const [k1, k2] = await t.db
    .insert(schema.kwarran)
    .values([{ name: 'Kwarran Satu' }, { name: 'Kwarran Dua' }])
    .returning();
  const [gA, gB, gC] = await t.db
    .insert(schema.gudep)
    .values([
      { kwarranId: k1.id, name: 'Gudep A' },
      { kwarranId: k1.id, name: 'Gudep B' },
      { kwarranId: k2.id, name: 'Gudep C' },
    ])
    .returning();
  const base = { gender: 'L' as const, birthDate: '2012-03-04', golongan: 'PENGGALANG' as const, status: 'ACTIVE' as const };
  const [mA1, mA2, mA3, mB, mC] = await t.db
    .insert(schema.members)
    .values([
      { ...base, fullName: 'Ayu Anggota A1', gudepId: gA.id, kta: '10.12.11.0001', phone: '0812-0000-1111', notes: 'catatan-rahasia' },
      { ...base, fullName: 'Bima Anggota A2', gudepId: gA.id },
      { ...base, fullName: 'Candra Tidak Mendaftar', gudepId: gA.id },
      { ...base, fullName: 'Dewi Anggota B', gudepId: gB.id },
      { ...base, fullName: 'Eko Anggota C', gudepId: gC.id },
    ])
    .returning();
  const ev = (slug: string, dateStart: Date, over: Partial<typeof schema.events.$inferInsert> = {}) => ({
    slug,
    title: `Kegiatan ${slug}`,
    dateStart,
    location: 'Lapangan Uji',
    organizer: 'Kwarcab Uji',
    published: true,
    ...over,
  });
  const [past, future, cancelled, draft] = await t.db
    .insert(schema.events)
    .values([
      ev('lalu', new Date('2026-10-05T01:00:00Z')),
      ev('nanti', new Date('2026-10-20T01:00:00Z')),
      ev('batal', new Date('2026-10-01T01:00:00Z'), { cancelled: true }),
      ev('draf', new Date('2026-10-01T01:00:00Z'), { published: false }),
    ])
    .returning();
  Object.assign(ids, {
    k1: k1.id,
    k2: k2.id,
    gA: gA.id,
    gB: gB.id,
    gC: gC.id,
    mA1: mA1.id,
    mA2: mA2.id,
    mA3: mA3.id,
    mB: mB.id,
    mC: mC.id,
    past: past.id,
    future: future.id,
    cancelled: cancelled.id,
    draft: draft.id,
  });
  await t.db
    .insert(schema.eventRegistrations)
    .values([
      ...[mA1, mA2, mB, mC].map((m) => ({ eventId: past.id, memberId: m.id })),
      { eventId: future.id, memberId: mA1.id },
      { eventId: cancelled.id, memberId: mA1.id },
      { eventId: draft.id, memberId: mA1.id },
    ]);
});
afterEach(async () => {
  await t.close();
});

const staffA = () => actor('STAFF_GUDEP', { gudepId: ids.gA, name: 'Pembina A' });
const staffB = () => actor('STAFF_GUDEP', { gudepId: ids.gB, name: 'Pembina B' });
const kwarran1 = () => actor('STAFF_KWARRAN', { kwarranId: ids.k1, name: 'Staf Kwarran Satu' });
const kwarran2 = () => actor('STAFF_KWARRAN', { kwarranId: ids.k2, name: 'Staf Kwarran Dua' });
const kwarcab = () => actor('ADMIN_KWARCAB', { name: 'Pengurus Kwarcab' });
const o = () => ({ db: t.db, now: NOW });
const rec = (who: ReturnType<typeof actor>, memberId: string, status: unknown, extra: { eventId?: string; note?: unknown } = {}) =>
  recordAttendance(who, { eventId: extra.eventId ?? ids.past, memberId, status, note: extra.note }, o());
const attendanceRows = () => t.db.select().from(schema.eventAttendance);

describe('presensi kegiatan (2.2) — izin', () => {
  it('Admin Website dan Peserta tidak bisa mencatat, membaca lembar, atau mengekspor', async () => {
    for (const who of [actor('ADMIN_WEBSITE'), actor('PESERTA', { memberId: ids.mA1 })]) {
      expect(await rec(who, ids.mA1, 'PRESENT')).toEqual({ ok: false, reason: 'tidak-diizinkan' });
      expect(await attendanceSheet(who, ids.past, o())).toBeNull();
      expect(await exportAttendanceCsv(who, ids.past, o())).toBeNull();
    }
    expect(await attendanceRows()).toHaveLength(0);
  });

  it('staf gudep tanpa penugasan gudep tidak melihat & tidak bisa mencatat siapa pun (gagal tertutup)', async () => {
    const lost = actor('STAFF_GUDEP', { gudepId: null });
    expect(await rec(lost, ids.mA1, 'PRESENT')).toEqual({ ok: false, reason: 'tidak-ditemukan' });
    expect((await attendanceSheet(lost, ids.past, o()))?.rows).toEqual([]);
  });
});

describe('presensi kegiatan (2.2) — cakupan (IDOR)', () => {
  it('staf gudep B tidak bisa mencatat anggota gudep A; staf kwarran lain juga tidak', async () => {
    expect(await rec(staffB(), ids.mA1, 'ABSENT')).toEqual({ ok: false, reason: 'tidak-ditemukan' });
    expect(await rec(kwarran2(), ids.mA1, 'ABSENT')).toEqual({ ok: false, reason: 'tidak-ditemukan' });
    expect(await rec(staffA(), ids.mB, 'ABSENT')).toEqual({ ok: false, reason: 'tidak-ditemukan' });
    expect(await attendanceRows()).toHaveLength(0);
    // Dalam cakupan: staf kwarran se-kecamatan dan Kwarcab boleh.
    expect((await rec(kwarran1(), ids.mB, 'PRESENT')).ok).toBe(true);
    expect((await rec(kwarcab(), ids.mC, 'PRESENT')).ok).toBe(true);
    expect(await rec(kwarran1(), ids.mC, 'PRESENT')).toEqual({ ok: false, reason: 'tidak-ditemukan' });
  });

  it('lembar presensi hanya memuat pendaftar dalam cakupan', async () => {
    const names = async (who: ReturnType<typeof actor>) => (await attendanceSheet(who, ids.past, o()))!.rows.map((r) => r.fullName);
    expect(await names(staffA())).toEqual(['Ayu Anggota A1', 'Bima Anggota A2']);
    expect(await names(staffB())).toEqual(['Dewi Anggota B']);
    expect(await names(kwarran1())).toEqual(['Ayu Anggota A1', 'Bima Anggota A2', 'Dewi Anggota B']);
    expect(await names(kwarcab())).toHaveLength(4);
  });

  it('CSV staf gudep B tidak memuat anggota gudep A (dan sebaliknya)', async () => {
    await rec(staffA(), ids.mA1, 'PRESENT');
    const b = await exportAttendanceCsv(staffB(), ids.past, o());
    expect(b?.count).toBe(1);
    expect(b?.csv).toContain('Dewi Anggota B');
    expect(b?.csv).not.toContain('Ayu Anggota A1');
    const a = await exportAttendanceCsv(staffA(), ids.past, o());
    expect(a?.csv).not.toContain('Dewi Anggota B');
    expect(a?.csv).not.toContain('Eko Anggota C');
    const k2 = await exportAttendanceCsv(kwarran2(), ids.past, o());
    expect(k2?.count).toBe(1);
    expect(k2?.csv).toContain('Eko Anggota C');
    expect(k2?.csv).not.toContain('Ayu Anggota A1');
  });
});

describe('presensi kegiatan (2.2) — hanya pendaftar & keadaan kegiatan', () => {
  it('anggota dalam cakupan tetapi tidak terdaftar ditolak; id asing ditolak', async () => {
    expect(await rec(staffA(), ids.mA3, 'PRESENT')).toEqual({ ok: false, reason: 'tidak-ditemukan' });
    expect(await rec(staffA(), ids.mA2, 'PRESENT', { eventId: ids.future })).toEqual({ ok: false, reason: 'tidak-ditemukan' });
    expect(await rec(staffA(), crypto.randomUUID(), 'PRESENT')).toEqual({ ok: false, reason: 'tidak-ditemukan' });
    expect((await rec(staffA(), 'bukan-uuid', 'PRESENT')).ok).toBe(false);
    expect(await attendanceRows()).toHaveLength(0);
  });

  it('kegiatan belum dimulai, dibatalkan, atau belum tayang tidak bisa dicatat', async () => {
    expect(await rec(staffA(), ids.mA1, 'PRESENT', { eventId: ids.future })).toEqual({ ok: false, reason: 'belum-dimulai' });
    expect(await rec(staffA(), ids.mA1, 'PRESENT', { eventId: ids.cancelled })).toEqual({ ok: false, reason: 'dibatalkan' });
    expect(await rec(staffA(), ids.mA1, 'PRESENT', { eventId: ids.draft })).toEqual({ ok: false, reason: 'tidak-ditemukan' });
    expect(await attendanceSheet(staffA(), ids.draft, o())).toBeNull();
    const future = await attendanceSheet(staffA(), ids.future, o());
    expect(future?.canRecord).toBe(false);
    expect(future?.blocked).toBe('belum-dimulai');
    expect((await attendanceSheet(staffA(), ids.past, o()))?.canRecord).toBe(true);
  });

  it('presensi dibuka pukul 00.00 WIB pada hari kegiatan', () => {
    // 08.00 WIB 10 Okt → dibuka 00.00 WIB 10 Okt (= 17.00 UTC 9 Okt).
    expect(attendanceOpensAt(new Date('2026-10-10T01:00:00Z')).toISOString()).toBe('2026-10-09T17:00:00.000Z');
    // 01.00 WIB 10 Okt (masih 9 Okt di UTC) → tetap hari WIB yang sama.
    expect(attendanceOpensAt(new Date('2026-10-09T18:00:00Z')).toISOString()).toBe('2026-10-09T17:00:00.000Z');
    expect(wibDateTime(new Date('2026-10-09T18:05:00Z'))).toBe('2026-10-10 01:05');
  });

  it('jalur formulir Server Action: catatan kosong diterima, isian buruk & peran tanpa izin ditolak', async () => {
    const form = (fields: Record<string, string>) => {
      const fd = new FormData();
      for (const [k, v] of Object.entries(fields)) fd.append(k, v);
      return fd;
    };
    // Catatan kosong (kasus paling umum di lapangan) dinormalisasi jadi null dan tetap tersimpan.
    expect(await recordAttendanceForm(staffA(), ids.past, ids.mA1, form({ status: 'PRESENT', note: '' }), o())).toMatchObject({
      ok: true,
      changed: true,
      status: 'PRESENT',
    });
    expect(await recordAttendanceForm(staffA(), ids.past, ids.mA2, form({ status: 'ABSENT' }), o())).toMatchObject({ ok: true });
    expect((await attendanceRows()).map((r) => [r.status, r.note]).sort()).toEqual([
      ['ABSENT', null],
      ['PRESENT', null],
    ]);
    const noStatus = await recordAttendanceForm(staffA(), ids.past, ids.mA1, form({ note: 'x' }), o());
    expect(!noStatus.ok && noStatus.errors?.status).toBeTruthy();
    const longNote = await recordAttendanceForm(staffA(), ids.past, ids.mA1, form({ status: 'EXCUSED', note: 'x'.repeat(201) }), o());
    expect(!longNote.ok && longNote.errors?.note).toMatch(/200/);
    // Argumen terikat tetap divalidasi & dicek cakupannya.
    expect(await recordAttendanceForm(staffB(), ids.past, ids.mA1, form({ status: 'ABSENT' }), o())).toEqual({
      ok: false,
      reason: 'tidak-ditemukan',
    });
    expect((await recordAttendanceForm(staffA(), 'bukan-uuid', ids.mA1, form({ status: 'ABSENT' }), o())).ok).toBe(false);
    for (const who of [actor('ADMIN_WEBSITE'), actor('PESERTA', { memberId: ids.mA1 })]) {
      expect(await recordAttendanceForm(who, ids.past, ids.mA1, form({ status: 'ABSENT' }), o())).toEqual({
        ok: false,
        reason: 'tidak-diizinkan',
      });
    }
    expect((await attendanceRows()).map((r) => r.status).sort()).toEqual(['ABSENT', 'PRESENT']);
  });

  it('anggota yang sudah dianonimkan tidak bisa dicatat lagi', async () => {
    await t.db.update(schema.members).set({ anonymizedAt: NOW }).where(eq(schema.members.id, ids.mA2));
    expect(await rec(staffA(), ids.mA2, 'PRESENT')).toEqual({ ok: false, reason: 'tidak-ditemukan' });
    const sheet = await attendanceSheet(staffA(), ids.past, o());
    expect(sheet?.rows.map((r) => [r.fullName, r.recordable])).toEqual([
      ['Ayu Anggota A1', true],
      ['Bima Anggota A2', false],
    ]);
    expect(await attendanceRows()).toHaveLength(0);
  });

  it('status & catatan divalidasi Zod di server', async () => {
    const bad = await rec(staffA(), ids.mA1, 'HADIR');
    expect(bad.ok).toBe(false);
    expect(!bad.ok && bad.reason).toBe('tidak-valid');
    expect(!bad.ok && bad.errors?.status).toBeTruthy();
    const long = await rec(staffA(), ids.mA1, 'EXCUSED', { note: 'x'.repeat(201) });
    expect(!long.ok && long.errors?.note).toMatch(/200/);
    expect((await rec(staffA(), ids.mA1, 'EXCUSED', { note: '  ' + 'x'.repeat(200) + '  ' })).ok).toBe(true);
  });
});

describe('presensi kegiatan (2.2) — upsert, rekap, audit', () => {
  it('mencatat ulang memperbarui satu baris (pencatat & waktu ikut berganti)', async () => {
    expect(await rec(staffA(), ids.mA1, 'PRESENT')).toMatchObject({ ok: true, changed: true, previous: null, status: 'PRESENT' });
    const later = new Date(NOW.getTime() + 3_600_000);
    const r = await recordAttendance(
      kwarran1(),
      { eventId: ids.past, memberId: ids.mA1, status: 'EXCUSED', note: 'Izin lomba' },
      { db: t.db, now: later },
    );
    expect(r).toMatchObject({ ok: true, changed: true, previous: 'PRESENT', status: 'EXCUSED' });
    const rows = await attendanceRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ status: 'EXCUSED', note: 'Izin lomba', recordedByName: 'Staf Kwarran Satu' });
    expect(rows[0].recordedAt.toISOString()).toBe(later.toISOString());
    // Tidak berubah → tidak menulis & tidak mengaudit.
    expect(
      await recordAttendance(kwarran1(), { eventId: ids.past, memberId: ids.mA1, status: 'EXCUSED', note: 'Izin lomba' }, o()),
    ).toMatchObject({
      ok: true,
      changed: false,
    });
    expect((await attendanceRows())[0].recordedAt.toISOString()).toBe(later.toISOString());
  });

  it('rekap menghitung hadir/izin/alpa/belum dicatat atas pendaftar dalam cakupan', async () => {
    await rec(kwarcab(), ids.mA1, 'PRESENT');
    await rec(kwarcab(), ids.mA2, 'ABSENT');
    await rec(kwarcab(), ids.mB, 'EXCUSED');
    await rec(kwarcab(), ids.mA2, 'PRESENT'); // koreksi
    const all = await attendanceSheet(kwarcab(), ids.past, o());
    expect(all?.recap).toEqual({ present: 2, excused: 1, absent: 0, notRecorded: 1, total: 4 });
    expect((await attendanceSheet(staffA(), ids.past, o()))?.recap).toEqual({
      present: 2,
      excused: 0,
      absent: 0,
      notRecorded: 0,
      total: 2,
    });
    expect(recapOf([])).toEqual({ present: 0, excused: 0, absent: 0, notRecorded: 0, total: 0 });
  });

  it('setiap perubahan tercatat di log audit tanpa nama anggota & tanpa catatan', async () => {
    await rec(staffA(), ids.mA1, 'PRESENT', { note: 'catatan pribadi' });
    await rec(staffA(), ids.mA1, 'ABSENT', { note: 'catatan pribadi' });
    await rec(staffA(), ids.mA1, 'ABSENT', { note: 'catatan pribadi' }); // tanpa perubahan
    const logs = await t.db.select().from(schema.auditLogs).where(like(schema.auditLogs.action, 'attendance.%'));
    expect(logs.map((l) => l.action)).toEqual(['attendance.record', 'attendance.update']);
    expect(logs[1].summary).toContain('Alpa');
    expect(logs[1].summary).toContain('sebelumnya Hadir');
    expect(logs.every((l) => l.entityId === ids.mA1 && l.actorName === 'Pembina A')).toBe(true);
    for (const l of logs) {
      expect(l.summary).not.toContain('Ayu');
      expect(l.summary).not.toContain('catatan pribadi');
    }
  });
});

describe('presensi kegiatan (2.2) — portal peserta', () => {
  it('peserta hanya melihat riwayat kehadirannya sendiri', async () => {
    await rec(kwarcab(), ids.mA1, 'PRESENT', { note: 'catatan pembina' });
    await rec(kwarcab(), ids.mA2, 'ABSENT');
    await rec(kwarcab(), ids.mB, 'EXCUSED');
    const mine = await ownAttendanceHistory(actor('PESERTA', { memberId: ids.mA1 }), o());
    expect(mine).toEqual([expect.objectContaining({ eventId: ids.past, status: 'PRESENT', title: 'Kegiatan lalu' })]);
    expect(Object.keys(mine[0])).not.toContain('note');
    const other = await ownAttendanceHistory(actor('PESERTA', { memberId: ids.mB }), o());
    expect(other.map((h) => h.status)).toEqual(['EXCUSED']);
    expect(await ownAttendanceHistory(actor('PESERTA', { memberId: null }), o())).toEqual([]);
    // Akun staf dengan memberId (mis. data salah isi) tetap tidak mendapat riwayat lewat jalur peserta.
    expect(await ownAttendanceHistory(actor('STAFF_GUDEP', { gudepId: ids.gA, memberId: ids.mA1 }), o())).toEqual([]);
  });

  it('kegiatan yang ditarik dari tayang tidak muncul di riwayat', async () => {
    await rec(kwarcab(), ids.mA1, 'PRESENT');
    await t.db.update(schema.events).set({ published: false }).where(eq(schema.events.id, ids.past));
    expect(await ownAttendanceHistory(actor('PESERTA', { memberId: ids.mA1 }), o())).toEqual([]);
  });

  it('pendaftaran yang sudah dihapus tidak menyisakan riwayat (sama dengan lembar staf)', async () => {
    await rec(kwarcab(), ids.mA1, 'EXCUSED');
    await rec(kwarcab(), ids.mA2, 'PRESENT');
    await t.db
      .delete(schema.eventRegistrations)
      .where(and(eq(schema.eventRegistrations.eventId, ids.past), eq(schema.eventRegistrations.memberId, ids.mA1)));
    expect(await ownAttendanceHistory(actor('PESERTA', { memberId: ids.mA1 }), o())).toEqual([]);
    expect((await attendanceSheet(kwarcab(), ids.past, o()))?.rows.map((r) => r.fullName)).not.toContain('Ayu Anggota A1');
    expect((await ownAttendanceHistory(actor('PESERTA', { memberId: ids.mA2 }), o())).map((h) => h.status)).toEqual(['PRESENT']);
  });
});

describe('presensi kegiatan (2.2) — CSV', () => {
  it('kolom sesuai, tanpa kolom sensitif/catatan, aman dari injeksi formula, dan tercatat di audit', async () => {
    await t.db.update(schema.members).set({ fullName: '=HYPERLINK("http://contoh.invalid","klik")' }).where(eq(schema.members.id, ids.mA2));
    await rec(staffA(), ids.mA1, 'EXCUSED', { note: 'catatan-presensi-rahasia' });
    const out = await exportAttendanceCsv(staffA(), ids.past, o());
    expect(out?.filename).toBe('presensi-lalu.csv');
    const csv = out!.csv;
    expect(csv).toContain(`"'=HYPERLINK(""http://contoh.invalid"",""klik"")"`);
    expect(csv).not.toContain('catatan-presensi-rahasia');
    expect(csv).not.toContain('0812-0000-1111');
    expect(csv).not.toContain('catatan-rahasia');
    const [header, ...rows] = parseCsv(csv);
    expect(header).toEqual(['Nama Lengkap', 'No KTA', 'Golongan', 'Gudep', 'Status Kehadiran', 'Dicatat Oleh', 'Waktu Dicatat (WIB)']);
    const ayu = rows.find((r) => r[0] === 'Ayu Anggota A1');
    expect(ayu).toEqual(['Ayu Anggota A1', '10.12.11.0001', expect.any(String), 'Gudep A', 'Izin', 'Pembina A', wibDateTime(NOW)]);
    expect(rows.find((r) => r[0].startsWith('=HYPERLINK'))?.[4]).toBe('Belum dicatat');
    const logs = await t.db.select().from(schema.auditLogs).where(eq(schema.auditLogs.action, 'attendance.export'));
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ entityType: 'event', entityId: ids.past, actorName: 'Pembina A' });
  });

  it('kegiatan tidak tayang atau id asing → null (route menjawab 404)', async () => {
    expect(await exportAttendanceCsv(staffA(), ids.draft, o())).toBeNull();
    expect(await exportAttendanceCsv(staffA(), 'bukan-uuid', o())).toBeNull();
    expect(await exportAttendanceCsv(staffA(), crypto.randomUUID(), o())).toBeNull();
  });
});
