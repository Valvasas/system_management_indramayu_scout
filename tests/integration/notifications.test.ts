import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { schema } from '@/db';
import type { Role } from '@/db/schema';
import {
  listNotifications,
  markAllRead,
  markRead,
  notify,
  resolveRecipients,
  safeHref,
  setPreference,
  unreadCount,
} from '@/features/notifications/notify';
import { createTestDb, type TestDb } from '../helpers/test-db';

let t: TestDb;
const ids: Record<string, string> = {};
let gudepA: string;
let gudepB: string;

async function user(username: string, role: Role, over: Partial<typeof schema.users.$inferInsert> = {}) {
  const [u] = await t.db
    .insert(schema.users)
    .values({ username, name: username, passwordHash: 'x', role, ...over })
    .returning();
  ids[username] = u.id;
}

beforeEach(async () => {
  t = await createTestDb();
  const [k1] = await t.db.insert(schema.kwarran).values({ name: 'K1' }).returning();
  const [k2] = await t.db.insert(schema.kwarran).values({ name: 'K2' }).returning();
  const [a] = await t.db.insert(schema.gudep).values({ kwarranId: k1.id, name: 'Gudep A' }).returning();
  const [b] = await t.db.insert(schema.gudep).values({ kwarranId: k2.id, name: 'Gudep B' }).returning();
  gudepA = a.id;
  gudepB = b.id;
  const [mA] = await t.db
    .insert(schema.members)
    .values({ fullName: 'Peserta A', gender: 'L', birthDate: '2012-01-01', golongan: 'PENGGALANG', gudepId: gudepA })
    .returning();
  await user('admin', 'SUPER_ADMIN');
  await user('kwarcab', 'ADMIN_KWARCAB');
  await user('humas', 'ADMIN_WEBSITE');
  await user('kwarran1', 'STAFF_KWARRAN', { kwarranId: k1.id });
  await user('kwarran2', 'STAFF_KWARRAN', { kwarranId: k2.id });
  await user('gudepA', 'STAFF_GUDEP', { gudepId: gudepA });
  await user('gudepB', 'STAFF_GUDEP', { gudepId: gudepB });
  await user('pesertaA', 'PESERTA', { memberId: mA.id });
  await user('nonaktif', 'ADMIN_KWARCAB', { active: false });
});
afterEach(async () => {
  await t.close();
});

const names = async (spec: Parameters<typeof resolveRecipients>[0]) => {
  const got = new Set(await resolveRecipients(spec, t.db));
  return Object.keys(ids)
    .filter((n) => got.has(ids[n]))
    .sort();
};

describe('penerima notifikasi ditentukan di server berdasarkan izin + cakupan (2.1)', () => {
  it('pemegang izin dalam cakupan gudep A saja; akun nonaktif tidak pernah menerima', async () => {
    expect(await names({ permission: 'members.verify', gudepId: gudepA })).toEqual(['admin', 'kwarcab', 'kwarran1']);
    expect(await names({ permission: 'members.update', gudepId: gudepB })).toEqual(['admin', 'gudepB', 'kwarcab', 'kwarran2']);
  });

  it('izin tanpa cakupan wilayah (content.manage) → semua pemegangnya', async () => {
    expect(await names({ permission: 'content.manage' })).toEqual(['admin', 'humas', 'kwarcab']);
  });

  it('pengumuman gudep A untuk peserta tidak sampai ke staf atau gudep lain', async () => {
    expect(await names({ announcement: { audience: 'PESERTA', gudepId: gudepA } })).toEqual(['pesertaA']);
    expect(await names({ announcement: { audience: 'STAFF', gudepId: gudepB } })).toEqual([
      'admin',
      'gudepB',
      'humas',
      'kwarcab',
      'kwarran2',
    ]);
    expect((await names({ announcement: { audience: 'ALL', gudepId: null } })).length).toBe(8);
  });
});

describe('kepemilikan notifikasi', () => {
  it('pengguna tidak bisa membaca atau menandai notifikasi milik orang lain', async () => {
    await notify({ kind: 'SYSTEM', title: 'Untuk admin', recipients: { userIds: [ids.admin] } }, t.db);
    const [n] = await listNotifications(ids.admin, {}, t.db);
    expect(await listNotifications(ids.humas, {}, t.db)).toHaveLength(0);
    expect(await markRead(ids.humas, n.id, t.db)).toBe(false);
    expect(await markAllRead(ids.humas, t.db)).toBe(0);
    expect(await unreadCount(ids.admin, t.db)).toBe(1);
    expect(await markRead(ids.admin, n.id, t.db)).toBe(true);
    expect(await unreadCount(ids.admin, t.db)).toBe(0);
  });

  it('preferensi mematikan jenis tertentu, kecuali prioritas tinggi', async () => {
    await setPreference(ids.admin, 'ANNOUNCEMENT', false, t.db);
    expect(await notify({ kind: 'ANNOUNCEMENT', title: 'Biasa', recipients: { userIds: [ids.admin] } }, t.db)).toBe(0);
    expect(await notify({ kind: 'ANNOUNCEMENT', priority: 'HIGH', title: 'Penting', recipients: { userIds: [ids.admin] } }, t.db)).toBe(1);
  });

  it('dedupe per penerima, pelaku dikecualikan, isi dipangkas, tautan luar dibuang', async () => {
    const input = {
      kind: 'TERM_ENDING' as const,
      title: 'x'.repeat(300),
      body: 'baris\nbaru '.repeat(100),
      href: 'https://jahat.example/phish',
      recipients: { permission: 'users.manage' as const },
      dedupeKey: 'jabatan:1:2026-10',
      excludeUserId: ids.kwarcab,
    };
    expect(await notify(input, t.db)).toBe(1); // admin saja (kwarcab = pelaku)
    expect(await notify(input, t.db)).toBe(0);
    const [n] = await t.db.select().from(schema.notifications).where(eq(schema.notifications.userId, ids.admin));
    expect(n.title).toHaveLength(120);
    expect(n.body.length).toBeLessThanOrEqual(280);
    expect(n.body).not.toContain('\n');
    expect(n.href).toBeNull();
  });

  it('safeHref hanya menerima path internal', () => {
    expect(safeHref('/dashboard/mutasi')).toBe('/dashboard/mutasi');
    for (const bad of ['//evil.example', 'https://x.id', 'javascript:alert(1)', '/\\evil', 'dashboard']) expect(safeHref(bad)).toBeNull();
  });
});
