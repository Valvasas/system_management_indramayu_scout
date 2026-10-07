/**
 * SERVER-ONLY. Inti notifikasi dalam portal (2.1): penentuan penerima di SERVER berdasarkan
 * izin + cakupan, preferensi pengguna, dedupe, dan baca/tandai-dibaca milik sendiri saja.
 *
 * Isi notifikasi sengaja ringkas dan TANPA data sensitif (telepon, alamat, data wali, alasan
 * mutasi, isi pesan): cukup judul + tautan ke halaman yang menegakkan izinnya sendiri.
 * Gagal mengirim notifikasi tidak boleh menggagalkan aksi utama (notify() tidak melempar).
 */
import { and, count, desc, eq, inArray, isNull, or, sql, type SQL } from 'drizzle-orm';
import { getDb, schema, type Database } from '@/db';
import type { Audience, NotificationKind, NotificationPriority, Role } from '@/db/schema';
import { roleCan, type Permission } from '@/lib/auth/permissions';
import { reportError } from '@/lib/monitoring';

const ALL_ROLES: readonly Role[] = ['SUPER_ADMIN', 'ADMIN_KWARCAB', 'ADMIN_WEBSITE', 'STAFF_KWARRAN', 'STAFF_GUDEP', 'PESERTA'];
const KABUPATEN: readonly Role[] = ['SUPER_ADMIN', 'ADMIN_KWARCAB'];

export type Recipients =
  /** Pengguna tertentu (mis. penulis berita, pengaju mutasi). */
  | { userIds: string[] }
  /**
   * Pemegang izin yang cakupannya meliputi gudep/kwarran ini. Tanpa gudep/kwarran = semua
   * pemegang izin (dipakai untuk izin tanpa cakupan wilayah, mis. content.manage).
   */
  | { permission: Permission; gudepId?: string | null; kwarranId?: string | null }
  /** Penerima pengumuman: aturan sama persis dengan features/announcements/queries.ts. */
  | { announcement: { audience: Audience; gudepId: string | null } };

export interface NotifyInput {
  kind: NotificationKind;
  priority?: NotificationPriority;
  title: string;
  body?: string;
  /** Tautan DALAM portal (diawali '/'). Halaman tujuan tetap menegakkan izinnya sendiri. */
  href?: string | null;
  recipients: Recipients;
  /** Kunci unik per penerima: notifikasi dengan kunci sama tidak dikirim dua kali. */
  dedupeKey?: string;
  /** Jangan kirim ke pelaku aksi itu sendiri. */
  excludeUserId?: string | null;
}

const TITLE_MAX = 120;
const BODY_MAX = 280;

const clean = (s: string, max: number) => s.replace(/\s+/g, ' ').trim().slice(0, max);

/** Hanya path internal: tolak URL absolut, protokol, dan `//host` (open redirect). */
export function safeHref(href: string | null | undefined): string | null {
  if (!href) return null;
  return /^\/(?!\/)[\w\-./?=&%#]*$/.test(href) ? href : null;
}

async function gudepKwarran(d: Database, gudepId: string): Promise<string | null> {
  const [g] = await d.select({ k: schema.gudep.kwarranId }).from(schema.gudep).where(eq(schema.gudep.id, gudepId)).limit(1);
  return g?.k ?? null;
}

/** Penerima → daftar id pengguna aktif. Diekspor untuk tes. */
export async function resolveRecipients(spec: Recipients, db?: Database): Promise<string[]> {
  const d = db ?? (await getDb());
  const u = schema.users;

  if ('userIds' in spec) {
    if (spec.userIds.length === 0) return [];
    const rows = await d
      .select({ id: u.id })
      .from(u)
      .where(and(inArray(u.id, spec.userIds), eq(u.active, true)));
    return rows.map((r) => r.id);
  }

  if ('permission' in spec) {
    const roles = ALL_ROLES.filter((r) => roleCan(r, spec.permission));
    if (roles.length === 0) return [];
    const kwarranId = spec.kwarranId ?? (spec.gudepId ? await gudepKwarran(d, spec.gudepId) : null);
    let scope: SQL | undefined;
    if (spec.gudepId || kwarranId) {
      // Kwarcab & peran tanpa cakupan wilayah (ADMIN_WEBSITE) melihat semua; staf sesuai wilayahnya.
      const parts: SQL[] = [inArray(u.role, [...KABUPATEN, 'ADMIN_WEBSITE'])];
      if (kwarranId) parts.push(and(eq(u.role, 'STAFF_KWARRAN'), eq(u.kwarranId, kwarranId))!);
      if (spec.gudepId) parts.push(and(eq(u.role, 'STAFF_GUDEP'), eq(u.gudepId, spec.gudepId))!);
      scope = or(...parts);
    }
    const rows = await d
      .select({ id: u.id })
      .from(u)
      .where(and(eq(u.active, true), inArray(u.role, roles), scope));
    return rows.map((r) => r.id);
  }

  const { audience, gudepId } = spec.announcement;
  const ids = new Set<string>();
  if (audience === 'ALL' || audience === 'PESERTA') {
    const rows = await d
      .select({ id: u.id })
      .from(u)
      .innerJoin(schema.members, eq(schema.members.id, u.memberId))
      .where(and(eq(u.active, true), eq(u.role, 'PESERTA'), gudepId ? eq(schema.members.gudepId, gudepId) : undefined));
    rows.forEach((r) => ids.add(r.id));
  }
  if (audience === 'ALL' || audience === 'STAFF') {
    const kwarranId = gudepId ? await gudepKwarran(d, gudepId) : null;
    const staffScope = gudepId
      ? or(
          inArray(u.role, [...KABUPATEN, 'ADMIN_WEBSITE']),
          kwarranId ? and(eq(u.role, 'STAFF_KWARRAN'), eq(u.kwarranId, kwarranId)) : undefined,
          and(eq(u.role, 'STAFF_GUDEP'), eq(u.gudepId, gudepId)),
        )
      : undefined;
    const rows = await d
      .select({ id: u.id })
      .from(u)
      .where(and(eq(u.active, true), sql`${u.role} <> 'PESERTA'`, staffScope));
    rows.forEach((r) => ids.add(r.id));
  }
  return [...ids];
}

/** Kirim notifikasi. Mengembalikan jumlah yang benar-benar tersimpan. Tidak pernah melempar. */
export async function notify(input: NotifyInput, db?: Database): Promise<number> {
  try {
    const d = db ?? (await getDb());
    const priority = input.priority ?? 'NORMAL';
    let ids = (await resolveRecipients(input.recipients, d)).filter((id) => id !== input.excludeUserId);
    if (ids.length === 0) return 0;
    // Preferensi: jenis yang dimatikan tidak dikirim, kecuali prioritas tinggi.
    if (priority !== 'HIGH') {
      const muted = await d
        .select({ userId: schema.notificationPreferences.userId })
        .from(schema.notificationPreferences)
        .where(
          and(
            inArray(schema.notificationPreferences.userId, ids),
            eq(schema.notificationPreferences.kind, input.kind),
            eq(schema.notificationPreferences.enabled, false),
          ),
        );
      const mutedSet = new Set(muted.map((m) => m.userId));
      ids = ids.filter((id) => !mutedSet.has(id));
    }
    if (ids.length === 0) return 0;
    const rows = await d
      .insert(schema.notifications)
      .values(
        ids.map((userId) => ({
          userId,
          kind: input.kind,
          priority,
          title: clean(input.title, TITLE_MAX),
          body: clean(input.body ?? '', BODY_MAX),
          href: safeHref(input.href),
          dedupeKey: input.dedupeKey ?? null,
        })),
      )
      .onConflictDoNothing({ target: [schema.notifications.userId, schema.notifications.dedupeKey] })
      .returning({ id: schema.notifications.id });
    return rows.length;
  } catch (err) {
    await reportError(err, { area: 'notify' });
    return 0;
  }
}

/* ------------------------------------------------------------------ */
/* Baca — selalu dibatasi ke pemiliknya                                 */
/* ------------------------------------------------------------------ */

export async function unreadCount(userId: string, db?: Database): Promise<number> {
  const d = db ?? (await getDb());
  const [r] = await d
    .select({ n: count() })
    .from(schema.notifications)
    .where(and(eq(schema.notifications.userId, userId), isNull(schema.notifications.readAt)));
  return r.n;
}

export async function listNotifications(
  userId: string,
  opts: { limit?: number; offset?: number; unreadOnly?: boolean } = {},
  db?: Database,
) {
  const d = db ?? (await getDb());
  const t = schema.notifications;
  return d
    .select()
    .from(t)
    .where(and(eq(t.userId, userId), opts.unreadOnly ? isNull(t.readAt) : undefined))
    .orderBy(desc(t.createdAt))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);
}

/** Tandai dibaca. `WHERE user_id = pemilik` membuat id milik orang lain diam-diam tidak berpengaruh. */
export async function markRead(userId: string, notificationId: string, db?: Database): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(notificationId)) return false;
  const d = db ?? (await getDb());
  const t = schema.notifications;
  const rows = await d
    .update(t)
    .set({ readAt: new Date() })
    .where(and(eq(t.id, notificationId), eq(t.userId, userId), isNull(t.readAt)))
    .returning({ id: t.id });
  return rows.length === 1;
}

export async function markAllRead(userId: string, db?: Database): Promise<number> {
  const d = db ?? (await getDb());
  const t = schema.notifications;
  const rows = await d
    .update(t)
    .set({ readAt: new Date() })
    .where(and(eq(t.userId, userId), isNull(t.readAt)))
    .returning({ id: t.id });
  return rows.length;
}

export async function preferencesOf(userId: string, db?: Database): Promise<Partial<Record<NotificationKind, boolean>>> {
  const d = db ?? (await getDb());
  const rows = await d.select().from(schema.notificationPreferences).where(eq(schema.notificationPreferences.userId, userId));
  return Object.fromEntries(rows.map((r) => [r.kind, r.enabled]));
}

export async function setPreference(userId: string, kind: NotificationKind, enabled: boolean, db?: Database): Promise<void> {
  const d = db ?? (await getDb());
  await d
    .insert(schema.notificationPreferences)
    .values({ userId, kind, enabled, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [schema.notificationPreferences.userId, schema.notificationPreferences.kind],
      set: { enabled, updatedAt: new Date() },
    });
}
