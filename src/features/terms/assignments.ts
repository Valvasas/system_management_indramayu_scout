/**
 * SERVER-ONLY. Penugasan staf berperiode (2.4) — RIWAYAT informasional.
 *
 * - Hanya pemegang `users.manage` (dicek di sini DAN di pembungkus 'use server').
 * - Akun sasaran mengikuti aturan halaman /dashboard/pengguna/[id]: bukan akun peserta, dan
 *   akun Super Admin hanya bisa disentuh Super Admin. Di luar itu → "tidak ditemukan".
 * - Penugasan TIDAK PERNAH mengubah `users.kwarran_id`/`users.gudep_id`, peran, atau akses.
 *   Cakupan akses tetap diatur dari formulir akun; berakhirnya penugasan hanya memicu pengingat.
 */
import { and, desc, eq, sql } from 'drizzle-orm';
import { getDb, schema, type Database } from '@/db';
import type { Role } from '@/db/schema';
import { roleCan } from '@/lib/auth/permissions';
import type { SessionUser } from '@/lib/auth/session';
import { fail, parseForm, type FormState } from '@/lib/forms';
import { daysLeft, termState, wibToday, type TermState } from './dates';
import { ASSIGNMENT_FIELDS, AssignmentSchema, isRowId } from './validation';

/** Akun yang boleh dikelola penugasannya oleh aktor, atau null (tidak dibedakan alasannya). */
async function manageableTarget(d: Database, actor: SessionUser, userId: string) {
  if (!roleCan(actor.role, 'users.manage') || !isRowId(userId)) return null;
  const [u] = await d
    .select({ id: schema.users.id, name: schema.users.name, role: schema.users.role })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);
  if (!u || u.role === 'PESERTA') return null;
  if (u.role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') return null;
  return u;
}

export interface AssignmentView {
  id: string;
  role: Role;
  position: string;
  kwarranName: string | null;
  gudepName: string | null;
  termStart: string | null;
  termEnd: string | null;
  isActive: boolean;
  state: TermState;
  daysLeft: number | null;
}

/** Riwayat penugasan satu akun, terbaru dulu. `null` bila di luar wewenang aktor. */
export async function listAssignments(
  actor: SessionUser,
  userId: string,
  now: Date = new Date(),
  db?: Database,
): Promise<AssignmentView[] | null> {
  const d = db ?? (await getDb());
  const target = await manageableTarget(d, actor, userId);
  if (!target) return null;
  const a = schema.staffAssignments;
  const rows = await d
    .select({
      id: a.id,
      role: a.role,
      position: a.position,
      kwarranName: schema.kwarran.name,
      gudepName: schema.gudep.name,
      termStart: a.termStart,
      termEnd: a.termEnd,
      isActive: a.isActive,
    })
    .from(a)
    .leftJoin(schema.kwarran, eq(schema.kwarran.id, a.kwarranId))
    .leftJoin(schema.gudep, eq(schema.gudep.id, a.gudepId))
    .where(eq(a.userId, target.id))
    .orderBy(desc(a.isActive), sql`${a.termStart} desc nulls last`, desc(a.createdAt));
  const today = wibToday(now);
  return rows.map((r) => ({ ...r, state: termState(r, today), daysLeft: daysLeft(r, today) }));
}

export type AssignmentWriteResult = { ok: true; id: string; position: string } | { ok: false; state: FormState };

const notFound = (): AssignmentWriteResult => ({ ok: false, state: fail('Akun tidak ditemukan.') });

/** Catat penugasan baru (Zod di server, berakhir ≥ mulai, wilayah sesuai peran). */
export async function addAssignment(actor: SessionUser, userId: string, formData: FormData, db?: Database): Promise<AssignmentWriteResult> {
  const d = db ?? (await getDb());
  const target = await manageableTarget(d, actor, userId);
  if (!target) return notFound();
  const parsed = parseForm(AssignmentSchema, formData);
  if (parsed.error) return { ok: false, state: parsed.error };
  const v = parsed.data;
  if (v.role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') {
    return {
      ok: false,
      state: fail('Periksa kembali isian yang ditandai.', {
        [ASSIGNMENT_FIELDS.role]: 'Hanya Super Admin yang dapat mencatat penugasan Super Admin.',
      }),
    };
  }

  // Wilayah hanya untuk peran berwilayah; kwarran penugasan gudep diturunkan dari gudepnya.
  let kwarranId: string | null = null;
  let gudepId: string | null = null;
  if (v.role === 'STAFF_GUDEP') {
    const [g] = await d
      .select({ id: schema.gudep.id, kwarranId: schema.gudep.kwarranId })
      .from(schema.gudep)
      .where(eq(schema.gudep.id, v.gudepId!))
      .limit(1);
    if (!g)
      return { ok: false, state: fail('Periksa kembali isian yang ditandai.', { [ASSIGNMENT_FIELDS.gudepId]: 'Gudep tidak ditemukan.' }) };
    gudepId = g.id;
    kwarranId = g.kwarranId;
  } else if (v.role === 'STAFF_KWARRAN') {
    const [k] = await d.select({ id: schema.kwarran.id }).from(schema.kwarran).where(eq(schema.kwarran.id, v.kwarranId!)).limit(1);
    if (!k)
      return {
        ok: false,
        state: fail('Periksa kembali isian yang ditandai.', { [ASSIGNMENT_FIELDS.kwarranId]: 'Kwarran tidak ditemukan.' }),
      };
    kwarranId = k.id;
  }

  const [row] = await d
    .insert(schema.staffAssignments)
    .values({
      userId: target.id,
      role: v.role,
      position: v.position,
      kwarranId,
      gudepId,
      termStart: v.termStart,
      termEnd: v.termEnd,
      isActive: true,
      createdById: actor.id,
    })
    .returning({ id: schema.staffAssignments.id });
  return { ok: true, id: row.id, position: v.position };
}

export type EndAssignmentResult =
  { ok: true; position: string; termEnd: string } | { ok: false; reason: 'tidak-ditemukan' | 'sudah-berakhir' };

/**
 * Akhiri penugasan: nonaktif + tanggal berakhir = hari ini (WIB), kecuali sudah lebih awal.
 * Id penugasan harus milik akun `userId` (id dari akun lain → tidak ditemukan).
 */
export async function endAssignment(
  actor: SessionUser,
  userId: string,
  assignmentId: string,
  now: Date = new Date(),
  db?: Database,
): Promise<EndAssignmentResult> {
  const d = db ?? (await getDb());
  const target = await manageableTarget(d, actor, userId);
  if (!target || !isRowId(assignmentId)) return { ok: false, reason: 'tidak-ditemukan' };
  const a = schema.staffAssignments;
  const [row] = await d
    .select()
    .from(a)
    .where(and(eq(a.id, assignmentId), eq(a.userId, target.id)))
    .limit(1);
  if (!row) return { ok: false, reason: 'tidak-ditemukan' };
  const today = wibToday(now);
  if (termState(row, today) === 'ENDED') return { ok: false, reason: 'sudah-berakhir' };
  let termEnd = row.termEnd !== null && row.termEnd < today ? row.termEnd : today;
  // Penugasan yang belum mulai dibatalkan; tanggal berakhir tidak boleh mendahului tanggal mulai.
  if (row.termStart !== null && row.termStart > termEnd) termEnd = row.termStart;
  await d
    .update(a)
    .set({ isActive: false, termEnd })
    .where(and(eq(a.id, row.id), eq(a.userId, target.id)));
  return { ok: true, position: row.position, termEnd };
}
