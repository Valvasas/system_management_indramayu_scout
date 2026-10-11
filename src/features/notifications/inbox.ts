/**
 * SERVER-ONLY. Kotak masuk notifikasi (2.1): halaman, buka/tandai dibaca, dan preferensi.
 * Semua fungsi menerima id PEMILIK dari sesi (bukan dari formulir), jadi id notifikasi milik
 * orang lain tidak pernah terbaca atau berubah. Server Action tipis ada di actions.ts.
 */
import { and, count, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, schema, type Database } from '@/db';
import type { NotificationKind, Role } from '@/db/schema';
import { checkbox, parseForm } from '@/lib/forms';
import { preferenceKindsFor } from './labels';
import { listNotifications, safeHref, setPreference, unreadCount } from './notify';

export const PAGE_SIZE = 20;

export type InboxFilter = 'semua' | 'belum';

/** Parameter URL halaman notifikasi; nilai asing jatuh ke bawaan (tidak pernah melempar). */
export const InboxQuerySchema = z.object({
  halaman: z.coerce.number().int().min(1).max(100_000).catch(1),
  tampil: z.enum(['semua', 'belum']).catch('semua'),
});

export async function inboxPage(userId: string, opts: { page: number; filter: InboxFilter }, db?: Database) {
  const d = db ?? (await getDb());
  const t = schema.notifications;
  const unreadOnly = opts.filter === 'belum';
  const [[{ n: total }], unread] = await Promise.all([
    d
      .select({ n: count() })
      .from(t)
      .where(and(eq(t.userId, userId), unreadOnly ? isNull(t.readAt) : undefined)),
    unreadCount(userId, d),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, Math.trunc(opts.page) || 1), pageCount);
  const items = await listNotifications(userId, { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE, unreadOnly }, d);
  return { items, total, unread, page, pageCount };
}

/**
 * Buka satu notifikasi milik `userId`: tandai dibaca (bila belum) lalu kembalikan tautannya.
 * `null` = tidak ditemukan ATAU milik orang lain (tidak dibedakan, tidak ada kebocoran).
 */
export async function openNotification(userId: string, notificationId: string, db?: Database): Promise<{ href: string | null } | null> {
  if (!z.string().uuid().safeParse(notificationId).success) return null;
  const d = db ?? (await getDb());
  const t = schema.notifications;
  const [row] = await d
    .select({ href: t.href, readAt: t.readAt })
    .from(t)
    .where(and(eq(t.id, notificationId), eq(t.userId, userId)))
    .limit(1);
  if (!row) return null;
  if (!row.readAt) {
    await d
      .update(t)
      .set({ readAt: new Date() })
      .where(and(eq(t.id, notificationId), eq(t.userId, userId), isNull(t.readAt)));
  }
  // Tautan disaring ulang saat dipakai: baris lama/rusak tidak bisa menjadi open redirect.
  return { href: safeHref(row.href) };
}

/**
 * Simpan preferensi dari formulir: kotak centang per jenis (tercentang = aktif).
 * Hanya jenis yang relevan untuk peran ini yang diproses; kunci lain diabaikan.
 */
export async function savePreferences(
  user: { id: string; role: Role },
  formData: FormData,
  db?: Database,
): Promise<{ ok: true; saved: Partial<Record<NotificationKind, boolean>> } | { ok: false }> {
  const kinds = preferenceKindsFor(user.role);
  const shape = Object.fromEntries(kinds.map((k) => [k, checkbox])) as Record<NotificationKind, typeof checkbox>;
  const parsed = parseForm(z.object(shape).partial(), formData);
  if (parsed.error) return { ok: false };
  const d = db ?? (await getDb());
  const saved: Partial<Record<NotificationKind, boolean>> = {};
  for (const kind of kinds) {
    // Kotak centang yang tidak dicentang tidak terkirim sama sekali → dianggap dimatikan.
    const enabled = parsed.data[kind] === true;
    await setPreference(user.id, kind, enabled, d);
    saved[kind] = enabled;
  }
  return { ok: true, saved };
}
