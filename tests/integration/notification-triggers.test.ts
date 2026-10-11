import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { schema } from '@/db';
import type { NotificationKind, Role, UserRow } from '@/db/schema';
import { setPreference } from '@/features/notifications/notify';
import {
  notifyAccessRequested,
  notifyAnnouncementCreated,
  notifyConsentDecided,
  notifyEventRegistration,
  notifyNewsPublished,
  notifyNewsReturned,
  notifyNewsSubmitted,
  notifyTransferDecided,
  notifyTransferRequested,
  resetRequestRecipients,
  wibDay,
} from '@/features/notifications/triggers';
import { createTestDb, type TestDb } from '../helpers/test-db';

let t: TestDb;
const ids: Record<string, string> = {};
const users: Record<string, UserRow> = {};
let gudepA: string;
let gudepB: string;
let memberA: string;
let memberB: string;
let eventId: string;

async function user(username: string, role: Role, over: Partial<typeof schema.users.$inferInsert> = {}) {
  const [u] = await t.db
    .insert(schema.users)
    .values({ username, name: `Nama ${username}`, passwordHash: 'x', role, ...over })
    .returning();
  ids[username] = u.id;
  users[username] = u;
}

beforeEach(async () => {
  t = await createTestDb();
  const [k1] = await t.db.insert(schema.kwarran).values({ name: 'K1' }).returning();
  const [k2] = await t.db.insert(schema.kwarran).values({ name: 'K2' }).returning();
  const [a] = await t.db.insert(schema.gudep).values({ kwarranId: k1.id, name: 'Gudep Anggrek' }).returning();
  const [b] = await t.db.insert(schema.gudep).values({ kwarranId: k2.id, name: 'Gudep Bakau' }).returning();
  gudepA = a.id;
  gudepB = b.id;
  const [mA, mB] = await t.db
    .insert(schema.members)
    .values([
      {
        fullName: 'Rahasia Anak Satu',
        gender: 'P',
        birthDate: '2013-01-01',
        golongan: 'PENGGALANG',
        gudepId: gudepA,
        guardianName: 'Ibu Wali Rahasia',
      },
      { fullName: 'Peserta Bakau', gender: 'L', birthDate: '2012-01-01', golongan: 'PENGGALANG', gudepId: gudepB },
    ])
    .returning();
  memberA = mA.id;
  memberB = mB.id;
  await user('admin', 'SUPER_ADMIN');
  await user('admin2', 'SUPER_ADMIN');
  await user('kwarcab', 'ADMIN_KWARCAB');
  await user('humas', 'ADMIN_WEBSITE');
  await user('kwarran1', 'STAFF_KWARRAN', { kwarranId: k1.id });
  await user('kwarran2', 'STAFF_KWARRAN', { kwarranId: k2.id });
  await user('gudepA', 'STAFF_GUDEP', { gudepId: gudepA });
  await user('gudepB', 'STAFF_GUDEP', { gudepId: gudepB });
  // gudepId akun sengaja usang (gudep B): yang menentukan cakupan adalah gudep ANGGOTA (A).
  await user('pesertaA', 'PESERTA', { memberId: memberA, gudepId: gudepB });
  await user('pesertaB', 'PESERTA', { memberId: memberB, gudepId: gudepB });
  await user('nonaktif', 'ADMIN_KWARCAB', { active: false });
  const [e] = await t.db
    .insert(schema.events)
    .values({
      slug: 'latihan-gabungan',
      title: 'Latihan Gabungan',
      dateStart: new Date('2026-11-01T01:00:00Z'),
      location: 'Lapangan',
      organizer: 'Kwarcab',
      published: true,
      registrationOpen: true,
    })
    .returning();
  eventId = e.id;
});
afterEach(async () => {
  await t.close();
});

async function rows(kind?: NotificationKind) {
  const all = await t.db.select().from(schema.notifications);
  return kind ? all.filter((r) => r.kind === kind) : all;
}
async function namesOf(kind: NotificationKind) {
  const got = new Set((await rows(kind)).map((r) => r.userId));
  return Object.keys(ids)
    .filter((n) => got.has(ids[n]))
    .sort();
}
/** Semua teks notifikasi yang tersimpan, untuk memastikan tidak ada data sensitif yang ikut. */
async function allText() {
  return (await rows()).map((r) => `${r.title} ${r.body} ${r.href ?? ''}`).join('\n');
}

describe('mutasi: penerima sesuai izin + cakupan gudep tujuan, tanpa alasan (2.1)', () => {
  it('pengajuan sampai ke verifikator gudep TUJUAN saja; pelaku dikecualikan; tidak dobel', async () => {
    const transferId = crypto.randomUUID();
    const input = { transferId, fromGudepId: gudepB, toGudepId: gudepA, actorId: ids.kwarcab };
    expect(await notifyTransferRequested(input, t.db)).toBe(3);
    // Staf gudep tidak punya members.verify; kwarran lain & admin website di luar cakupan.
    expect(await namesOf('TRANSFER_REQUESTED')).toEqual(['admin', 'admin2', 'kwarran1']);
    expect(await notifyTransferRequested(input, t.db)).toBe(0);
    const [n] = await rows('TRANSFER_REQUESTED');
    expect(n.title).toContain('Gudep Anggrek');
    expect(n.body).toContain('Gudep Bakau');
    expect(n.href).toBe('/dashboard/mutasi');
  });

  it('keputusan hanya ke pengaju; tidak memuat nama anggota atau catatan', async () => {
    const [tr] = await t.db
      .insert(schema.memberTransfers)
      .values({
        memberId: memberB,
        fromGudepId: gudepB,
        toGudepId: gudepA,
        reason: 'Alasan keluarga yang sangat pribadi',
        requestedById: ids.gudepB,
        requestedByName: 'Nama gudepB',
      })
      .returning();
    const decided = {
      transferId: tr.id,
      requestedById: tr.requestedById,
      approved: false,
      fromGudepId: gudepB,
      toGudepId: gudepA,
      actorId: ids.kwarran1,
    };
    expect(await notifyTransferDecided(decided, t.db)).toBe(1);
    expect(await namesOf('TRANSFER_DECIDED')).toEqual(['gudepB']);
    const [n] = await rows('TRANSFER_DECIDED');
    expect(n.title).toContain('ditolak');
    const text = await allText();
    expect(text).not.toContain('Alasan keluarga');
    expect(text).not.toContain('Peserta Bakau');
    // Pengaju yang memutuskan sendiri tidak memberi tahu dirinya.
    await t.db.delete(schema.notifications);
    expect(await notifyTransferDecided({ ...decided, actorId: ids.gudepB, transferId: crypto.randomUUID() }, t.db)).toBe(0);
  });
});

describe('permintaan atur ulang sandi: hanya yang berwenang atas akun itu (2.1)', () => {
  it('akun peserta → pemegang users.create_peserta dalam cakupan gudep ANGGOTA, bukan gudepId akun yang usang', async () => {
    const got = await resetRequestRecipients(users.pesertaA, t.db);
    const names = Object.keys(ids).filter((n) => got.includes(ids[n]));
    expect(names.sort()).toEqual(['admin', 'admin2', 'gudepA', 'kwarcab', 'kwarran1']);
  });

  it('akun staf → users.manage; akun Super Admin → Super Admin lain saja; pemilik akun tidak pernah', async () => {
    const staff = await resetRequestRecipients(users.gudepB, t.db);
    expect(staff.sort()).toEqual([ids.admin, ids.admin2, ids.kwarcab].sort());
    expect(await resetRequestRecipients(users.admin, t.db)).toEqual([ids.admin2]);
    expect(await resetRequestRecipients(users.kwarcab, t.db)).not.toContain(ids.kwarcab);
  });

  it('prioritas tinggi menembus preferensi; tanpa nama pengguna atau catatan pemohon', async () => {
    await setPreference(ids.gudepA, 'ACCESS_REQUEST', false, t.db);
    const requestId = crypto.randomUUID();
    expect(await notifyAccessRequested({ requestId, target: users.pesertaA }, t.db)).toBe(5);
    expect(await namesOf('ACCESS_REQUEST')).toEqual(['admin', 'admin2', 'gudepA', 'kwarcab', 'kwarran1']);
    const all = await rows('ACCESS_REQUEST');
    expect(all.every((r) => r.priority === 'HIGH' && r.href === '/dashboard/akses')).toBe(true);
    expect(await allText()).not.toContain('pesertaA');
    expect(await notifyAccessRequested({ requestId, target: users.pesertaA }, t.db)).toBe(0);
  });
});

describe('persetujuan wali diputuskan (2.1)', () => {
  it('ke pembina peminta + staf members.update dalam cakupan; tanpa nama wali/anak/pilihan; sekali per permintaan', async () => {
    const [req] = await t.db
      .insert(schema.guardianConsentRequests)
      .values({
        memberId: memberA,
        codeHash: 'x',
        expiresAt: new Date(Date.now() + 3600_000),
        usedAt: new Date(),
        requestedById: ids.gudepA,
        requestedByName: 'Nama gudepA',
      })
      .returning();
    expect(await notifyConsentDecided({ memberId: memberA }, t.db)).toBe(5);
    expect(await namesOf('CONSENT_DECIDED')).toEqual(['admin', 'admin2', 'gudepA', 'kwarcab', 'kwarran1']);
    const text = await allText();
    for (const secret of ['Ibu Wali Rahasia', 'Rahasia Anak', 'disetujui', 'tidak setuju', 'foto', 'dokumentasi'])
      expect(text.toLowerCase()).not.toContain(secret.toLowerCase());
    const [n] = await rows('CONSENT_DECIDED');
    expect(n.href).toBe(`/dashboard/anggota/${memberA}`);
    expect(n.dedupeKey).toBe(`consent:${req.id}`);
    expect(await notifyConsentDecided({ memberId: memberA }, t.db)).toBe(0);
  });

  it('peminta di luar cakupan tetap diberi tahu; staf gudep lain tidak', async () => {
    await t.db.insert(schema.guardianConsentRequests).values({
      memberId: memberB,
      codeHash: 'y',
      expiresAt: new Date(Date.now() + 3600_000),
      usedAt: new Date(),
      requestedById: ids.kwarran1,
      requestedByName: 'Nama kwarran1',
    });
    await notifyConsentDecided({ memberId: memberB }, t.db);
    expect(await namesOf('CONSENT_DECIDED')).toEqual(['admin', 'admin2', 'gudepB', 'kwarcab', 'kwarran1', 'kwarran2']);
  });

  it('galat (mis. id rusak) tidak pernah melempar ke aksi utama', async () => {
    await expect(notifyConsentDecided({ memberId: 'bukan-uuid' }, t.db)).resolves.toBe(0);
  });
});

describe('pengumuman: cakupan audiens (2.1)', () => {
  it('pengumuman peserta gudep A hanya ke peserta gudep A', async () => {
    await notifyAnnouncementCreated(
      { announcementId: crypto.randomUUID(), title: 'Latihan Sabtu', audience: 'PESERTA', gudepId: gudepA, actorId: ids.gudepA },
      t.db,
    );
    expect(await namesOf('ANNOUNCEMENT')).toEqual(['pesertaA']);
  });

  it('pengumuman staf gudep A: kwarran lain & gudep lain tidak menerima; pembuat dikecualikan', async () => {
    await notifyAnnouncementCreated(
      { announcementId: crypto.randomUUID(), title: 'Rapat', audience: 'STAFF', gudepId: gudepA, actorId: ids.kwarran1 },
      t.db,
    );
    expect(await namesOf('ANNOUNCEMENT')).toEqual(['admin', 'admin2', 'gudepA', 'humas', 'kwarcab']);
  });
});

describe('pendaftaran kegiatan: prioritas rendah, maksimal sekali per kegiatan per hari WIB (2.1)', () => {
  it('dedupe per hari WIB; tautan sesuai izin penerima; preferensi dihormati', async () => {
    const day1 = new Date('2026-10-10T03:00:00Z'); // 10.00 WIB
    const lateDay1 = new Date('2026-10-10T16:30:00Z'); // 23.30 WIB, hari yang sama
    const day2 = new Date('2026-10-10T17:30:00Z'); // 00.30 WIB keesokan hari
    expect(wibDay(lateDay1)).toBe('2026-10-10');
    expect(wibDay(day2)).toBe('2026-10-11');

    await setPreference(ids.kwarcab, 'EVENT_REGISTRATION', false, t.db);
    const input = { eventId, eventTitle: 'Latihan Gabungan' };
    expect(await notifyEventRegistration(input, t.db, day1)).toBe(3);
    expect(await notifyEventRegistration(input, t.db, day1)).toBe(0);
    expect(await notifyEventRegistration(input, t.db, lateDay1)).toBe(0);
    expect(await namesOf('EVENT_REGISTRATION')).toEqual(['admin', 'admin2', 'humas']);

    const all = await rows('EVENT_REGISTRATION');
    expect(all.every((r) => r.priority === 'LOW')).toBe(true);
    const hrefOf = (name: string) => all.find((r) => r.userId === ids[name])?.href;
    expect(hrefOf('admin')).toBe(`/dashboard/pendaftaran/${eventId}`);
    // Admin website tidak punya members.read → diarahkan ke editor agenda, bukan daftar anggota.
    expect(hrefOf('humas')).toBe(`/dashboard/konten/agenda/${eventId}`);

    expect(await notifyEventRegistration(input, t.db, day2)).toBe(3);
    // Kegiatan lain di hari yang sama tetap terkirim.
    expect(await notifyEventRegistration({ eventId: crypto.randomUUID(), eventTitle: 'Lain' }, t.db, day1)).toBe(3);
  });
});

describe('alur berita (2.1)', () => {
  it('dikirim untuk review → semua pemegang content.manage kecuali pengirim', async () => {
    expect(await notifyNewsSubmitted({ newsId: crypto.randomUUID(), title: 'Bakti', actorId: ids.humas }, t.db)).toBe(3);
    expect(await namesOf('NEWS_REVIEW')).toEqual(['admin', 'admin2', 'kwarcab']);
  });

  it('dikembalikan & terbit hanya ke penulis, dengan tautan yang bisa ia buka', async () => {
    const newsId = crypto.randomUUID();
    await notifyNewsReturned({ newsId, title: 'Bakti', authorId: ids.gudepA, actorId: ids.admin }, t.db);
    await notifyNewsReturned({ newsId, title: 'Bakti', authorId: ids.humas, actorId: ids.admin }, t.db);
    const returned = await rows('NEWS_RETURNED');
    expect(returned.find((r) => r.userId === ids.gudepA)?.href).toBe(`/dashboard/kontribusi/${newsId}`);
    expect(returned.find((r) => r.userId === ids.humas)?.href).toBe(`/dashboard/konten/berita/${newsId}`);

    const now = new Date('2026-10-10T03:00:00Z');
    const base = { newsId, title: 'Bakti', slug: 'bakti', authorId: ids.gudepA, actorId: ids.admin };
    expect(await notifyNewsPublished({ ...base, publishedAt: now }, t.db, now)).toBe(1);
    expect((await rows('NEWS_PUBLISHED'))[0].href).toBe('/berita/bakti');
    expect(await notifyNewsPublished({ ...base, publishedAt: now }, t.db, now)).toBe(0);
    await t.db.delete(schema.notifications).where(eq(schema.notifications.kind, 'NEWS_PUBLISHED'));
    expect(await notifyNewsPublished({ ...base, publishedAt: new Date('2026-12-01T01:00:00Z') }, t.db, now)).toBe(1);
    expect((await rows('NEWS_PUBLISHED'))[0].href).toBe('/dashboard/kontribusi');
    // Editor yang menerbitkan beritanya sendiri tidak diberi tahu.
    expect(await notifyNewsPublished({ ...base, authorId: ids.admin, newsId: crypto.randomUUID(), publishedAt: now }, t.db, now)).toBe(0);
  });
});
