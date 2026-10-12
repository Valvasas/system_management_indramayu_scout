/**
 * SERVER-ONLY. Pengurus Kwarcab bermasa jabatan (2.4).
 *
 * Fungsi di sini menegakkan izin `content.manage` sendiri (selain `requirePermission` di
 * pembungkus 'use server' features/content/organization.ts), supaya bisa diuji tanpa konteks
 * request Next. Pengurus adalah konten publik tingkat kabupaten: tidak ada cakupan wilayah.
 * Pembungkus WAJIB memanggil `revalidatePublicSite()` setelah setiap penulisan.
 */
import { asc, eq } from 'drizzle-orm';
import { getDb, schema, type Database } from '@/db';
import { roleCan } from '@/lib/auth/permissions';
import type { SessionUser } from '@/lib/auth/session';
import { fail, parseForm, type FormState } from '@/lib/forms';
import { daysLeft, termState, wibToday, type TermState } from './dates';
import { BoardMemberSchema, isRowId } from './validation';

export type BoardMemberRow = typeof schema.boardMembers.$inferSelect;
export type BoardMemberWithTerm = BoardMemberRow & { state: TermState; daysLeft: number | null };

/**
 * Ringkasan CMS: menjabat (termasuk yang akan datang), hampir berakhir (≤ 30 hari), dan riwayat
 * periode. `null` bila aktor tidak memegang `content.manage`.
 */
export async function boardOverview(actor: SessionUser, now: Date = new Date(), db?: Database) {
  if (!roleCan(actor.role, 'content.manage')) return null;
  const d = db ?? (await getDb());
  const t = schema.boardMembers;
  const today = wibToday(now);
  const rows = await d.select().from(t).orderBy(asc(t.sortOrder), asc(t.name));
  const all: BoardMemberWithTerm[] = rows.map((r) => ({ ...r, state: termState(r, today), daysLeft: daysLeft(r, today) }));
  return {
    today,
    current: all.filter((r) => r.state !== 'ENDED'),
    ending: all.filter((r) => r.state === 'ENDING').sort((a, b) => (a.termEnd ?? '').localeCompare(b.termEnd ?? '')),
    // Periode terbaru dulu; baris tanpa tanggal berakhir (dinonaktifkan manual) di akhir.
    past: all.filter((r) => r.state === 'ENDED').sort((a, b) => (b.termEnd ?? '').localeCompare(a.termEnd ?? '')),
  };
}

export type BoardWriteResult = { ok: true; id: string; name: string; position: string } | { ok: false; state: FormState };

const forbidden = (): BoardWriteResult => ({ ok: false, state: fail('Anda tidak berwenang mengelola data pengurus.') });
const missing = (): BoardWriteResult => ({ ok: false, state: fail('Data pengurus tidak ditemukan.') });

/** Buat (`id` null) atau ubah pengurus. Validasi Zod di server, termasuk "berakhir ≥ mulai". */
export async function saveBoardMember(actor: SessionUser, id: string | null, formData: FormData, db?: Database): Promise<BoardWriteResult> {
  if (!roleCan(actor.role, 'content.manage')) return forbidden();
  if (id !== null && !isRowId(id)) return missing();
  const parsed = parseForm(BoardMemberSchema, formData);
  if (parsed.error) return { ok: false, state: parsed.error };
  const d = db ?? (await getDb());
  const t = schema.boardMembers;
  const v = parsed.data;
  if (id) {
    const [row] = await d.update(t).set(v).where(eq(t.id, id)).returning({ id: t.id });
    if (!row) return missing();
    return { ok: true, id: row.id, name: v.name, position: v.position };
  }
  const [row] = await d.insert(t).values(v).returning({ id: t.id });
  return { ok: true, id: row.id, name: v.name, position: v.position };
}

export async function deleteBoardMember(
  actor: SessionUser,
  id: string,
  db?: Database,
): Promise<{ ok: true; name: string } | { ok: false; reason: 'tidak-diizinkan' | 'tidak-ditemukan' }> {
  if (!roleCan(actor.role, 'content.manage')) return { ok: false, reason: 'tidak-diizinkan' };
  if (!isRowId(id)) return { ok: false, reason: 'tidak-ditemukan' };
  const d = db ?? (await getDb());
  const [row] = await d.delete(schema.boardMembers).where(eq(schema.boardMembers.id, id)).returning({ name: schema.boardMembers.name });
  return row ? { ok: true, name: row.name } : { ok: false, reason: 'tidak-ditemukan' };
}
