import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { schema } from '@/db';
import type { Role } from '@/db/schema';
import { PAGE_SIZE, inboxPage, openNotification, savePreferences } from '@/features/notifications/inbox';
import { markAllRead, notify, preferencesOf, unreadCount } from '@/features/notifications/notify';
import { createTestDb, type TestDb } from '../helpers/test-db';

let t: TestDb;
const ids: Record<string, string> = {};

async function user(username: string, role: Role) {
  const [u] = await t.db.insert(schema.users).values({ username, name: username, passwordHash: 'x', role }).returning();
  ids[username] = u.id;
}

async function seedFor(name: string, n: number, href: string | null = null) {
  await t.db.insert(schema.notifications).values(
    Array.from({ length: n }, (_, i) => ({
      userId: ids[name],
      kind: 'SYSTEM' as const,
      title: `${name} #${i + 1}`,
      href,
      // Urutan stabil: yang lebih baru punya createdAt lebih besar.
      createdAt: new Date(Date.UTC(2026, 9, 1, 0, i)),
    })),
  );
}

const form = (entries: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.append(k, v);
  return fd;
};

beforeEach(async () => {
  t = await createTestDb();
  await user('pembina', 'STAFF_GUDEP');
  await user('peserta', 'PESERTA');
});
afterEach(async () => {
  await t.close();
});

describe('kotak masuk hanya milik pemilik sesi (IDOR, 2.1)', () => {
  it('id notifikasi orang lain tidak terbuka, tidak bocor tautannya, dan tidak berubah', async () => {
    await notify({ kind: 'SYSTEM', title: 'Untuk pembina', href: '/dashboard/mutasi', recipients: { userIds: [ids.pembina] } }, t.db);
    const [n] = await t.db.select().from(schema.notifications);

    expect(await openNotification(ids.peserta, n.id, t.db)).toBeNull();
    expect(await openNotification(ids.peserta, 'bukan-uuid', t.db)).toBeNull();
    expect(await openNotification(ids.pembina, crypto.randomUUID(), t.db)).toBeNull();
    expect(await unreadCount(ids.pembina, t.db)).toBe(1);

    expect(await openNotification(ids.pembina, n.id, t.db)).toEqual({ href: '/dashboard/mutasi' });
    expect(await unreadCount(ids.pembina, t.db)).toBe(0);
    // Membuka lagi yang sudah dibaca tetap mengarah ke tautannya.
    expect(await openNotification(ids.pembina, n.id, t.db)).toEqual({ href: '/dashboard/mutasi' });
  });

  it('tautan tersimpan yang bukan path internal dibuang saat dibuka (anti open redirect)', async () => {
    const [row] = await t.db
      .insert(schema.notifications)
      .values({ userId: ids.pembina, kind: 'SYSTEM', title: 'Lama', href: '//jahat.example/masuk' })
      .returning();
    // Daftar juga tidak pernah merender tautan keluar dari baris yang rusak.
    expect((await inboxPage(ids.pembina, { page: 1, filter: 'semua' }, t.db)).items[0].href).toBeNull();
    expect(await openNotification(ids.pembina, row.id, t.db)).toEqual({ href: null });
    expect((await t.db.select().from(schema.notifications).where(eq(schema.notifications.id, row.id)))[0].readAt).not.toBeNull();
  });

  it('membuka milik sendiri tidak menyentuh notifikasi pengguna lain yang belum dibaca', async () => {
    await notify({ kind: 'SYSTEM', title: 'Sama', recipients: { userIds: [ids.pembina, ids.peserta] } }, t.db);
    const all = await t.db.select().from(schema.notifications);
    const mine = all.find((n) => n.userId === ids.peserta)!;
    expect(await openNotification(ids.peserta, mine.id, t.db)).toEqual({ href: null });
    expect(await unreadCount(ids.peserta, t.db)).toBe(0);
    expect(await unreadCount(ids.pembina, t.db)).toBe(1);
  });

  it('halaman & saringan hanya memuat milik sendiri; nomor halaman dijepit', async () => {
    await seedFor('pembina', 25);
    await seedFor('peserta', 3);

    const p1 = await inboxPage(ids.pembina, { page: 1, filter: 'semua' }, t.db);
    expect(p1).toMatchObject({ total: 25, unread: 25, page: 1, pageCount: 2 });
    expect(p1.items).toHaveLength(PAGE_SIZE);
    expect(p1.items[0].title).toBe('pembina #25');
    expect(p1.items.every((i) => i.userId === ids.pembina)).toBe(true);

    const p2 = await inboxPage(ids.pembina, { page: 99, filter: 'semua' }, t.db);
    expect(p2.page).toBe(2);
    expect(p2.items.map((i) => i.title)).toEqual(['pembina #5', 'pembina #4', 'pembina #3', 'pembina #2', 'pembina #1']);

    // Tandai semua milik peserta: milik pembina tidak tersentuh.
    expect(await markAllRead(ids.peserta, t.db)).toBe(3);
    const unreadOnly = await inboxPage(ids.pembina, { page: 1, filter: 'belum' }, t.db);
    expect(unreadOnly.total).toBe(25);
    const peserta = await inboxPage(ids.peserta, { page: 1, filter: 'belum' }, t.db);
    expect(peserta).toMatchObject({ total: 0, unread: 0, page: 1, pageCount: 1 });
    expect((await inboxPage(ids.peserta, { page: 1, filter: 'semua' }, t.db)).items).toHaveLength(3);
  });
});

describe('preferensi notifikasi (2.1)', () => {
  it('kotak tak tercentang = dimatikan; hanya jenis yang relevan untuk peran yang disimpan', async () => {
    const res = await savePreferences(
      { id: ids.peserta, role: 'PESERTA' },
      form({ SYSTEM: 'on', NEWS_REVIEW: 'on', ACCESS_REQUEST: 'on', bukanJenis: 'on' }),
      t.db,
    );
    expect(res).toEqual({ ok: true, saved: { ANNOUNCEMENT: false, SYSTEM: true } });
    expect(await preferencesOf(ids.peserta, t.db)).toEqual({ ANNOUNCEMENT: false, SYSTEM: true });

    // Pengumuman biasa tidak terkirim; prioritas tinggi tetap terkirim.
    expect(await notify({ kind: 'ANNOUNCEMENT', title: 'Biasa', recipients: { userIds: [ids.peserta] } }, t.db)).toBe(0);
    expect(await notify({ kind: 'ANNOUNCEMENT', priority: 'HIGH', title: 'Penting', recipients: { userIds: [ids.peserta] } }, t.db)).toBe(
      1,
    );

    await savePreferences({ id: ids.peserta, role: 'PESERTA' }, form({ ANNOUNCEMENT: 'on', SYSTEM: 'on' }), t.db);
    expect(await notify({ kind: 'ANNOUNCEMENT', title: 'Biasa lagi', recipients: { userIds: [ids.peserta] } }, t.db)).toBe(1);
  });

  it('permintaan akses tidak bisa dimatikan lewat formulir, dan preferensi satu pengguna tidak mengubah yang lain', async () => {
    await savePreferences({ id: ids.pembina, role: 'STAFF_GUDEP' }, form({}), t.db);
    const prefs = await preferencesOf(ids.pembina, t.db);
    expect(prefs.ACCESS_REQUEST).toBeUndefined();
    expect(prefs.TRANSFER_DECIDED).toBe(false);
    expect(await preferencesOf(ids.peserta, t.db)).toEqual({});
  });

  it('isian ganda yang tidak sah ditolak tanpa menyimpan apa pun', async () => {
    const fd = form({ SYSTEM: 'on' });
    fd.append('SYSTEM', 'on');
    expect(await savePreferences({ id: ids.peserta, role: 'PESERTA' }, fd, t.db)).toEqual({ ok: false });
    expect(await preferencesOf(ids.peserta, t.db)).toEqual({});
  });
});
