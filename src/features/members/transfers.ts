/**
 * Query mutasi anggota antar-gudep (bukan Server Action). Cakupan selalu diterapkan:
 * - "menunggu persetujuan": gudep TUJUAN dalam cakupan & punya izin verifikasi;
 * - "diajukan": gudep ASAL dalam cakupan;
 * - riwayat anggota: hanya untuk anggota yang boleh dilihat (dicek pemanggil lewat getMember).
 */
import { and, asc, desc, eq, inArray, ne, or, type SQL } from 'drizzle-orm';
import { alias, type AnyPgColumn } from 'drizzle-orm/pg-core';
import type { Database } from '@/db';
import { getDb, schema } from '@/db';
import { scopeLevel } from '@/lib/auth/scope';
import { can, type SessionUser } from '@/lib/auth/session';

const fromG = alias(schema.gudep, 'from_g');
const toG = alias(schema.gudep, 'to_g');

/** Id gudep dalam cakupan; `null` = seluruh kabupaten. */
export async function scopedGudepIds(user: SessionUser): Promise<string[] | null> {
  const level = scopeLevel(user);
  if (level === 'KABUPATEN') return null;
  if (level === 'GUDEP') return [user.gudepId!];
  if (level === 'KWARRAN') {
    const db = await getDb();
    const rows = await db.select({ id: schema.gudep.id }).from(schema.gudep).where(eq(schema.gudep.kwarranId, user.kwarranId!));
    return rows.map((r) => r.id);
  }
  return [];
}

const inScope = (col: AnyPgColumn, ids: string[] | null): SQL | undefined =>
  ids === null ? undefined : ids.length ? inArray(col, ids) : eq(col, '00000000-0000-0000-0000-000000000000');

const transferSelect = {
  t: schema.memberTransfers,
  memberName: schema.members.fullName,
  golongan: schema.members.golongan,
  fromName: fromG.name,
  toName: toG.name,
};

/**
 * Builder query (BELUM dieksekusi). Jangan di-`await` sebelum `.where()`: builder Drizzle
 * bersifat thenable, sehingga `await` langsung menjalankan query tanpa filter.
 */
function baseQuery(db: Database) {
  return db
    .select(transferSelect)
    .from(schema.memberTransfers)
    .innerJoin(schema.members, eq(schema.members.id, schema.memberTransfers.memberId))
    .innerJoin(fromG, eq(fromG.id, schema.memberTransfers.fromGudepId))
    .innerJoin(toG, eq(toG.id, schema.memberTransfers.toGudepId));
}

export async function transfersForMember(memberId: string) {
  return baseQuery(await getDb())
    .where(eq(schema.memberTransfers.memberId, memberId))
    .orderBy(desc(schema.memberTransfers.createdAt));
}

export async function openTransferForMember(memberId: string) {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(schema.memberTransfers)
    .where(and(eq(schema.memberTransfers.memberId, memberId), eq(schema.memberTransfers.status, 'REQUESTED')))
    .limit(1);
  return row ?? null;
}

/** Mutasi yang menunggu keputusan PENGGUNA INI (gudep tujuan dalam cakupannya). */
export async function transfersAwaitingDecision(user: SessionUser) {
  if (!can(user, 'members.verify')) return [];
  const ids = await scopedGudepIds(user);
  return baseQuery(await getDb())
    .where(and(eq(schema.memberTransfers.status, 'REQUESTED'), inScope(schema.memberTransfers.toGudepId, ids)))
    .orderBy(asc(schema.memberTransfers.createdAt));
}

/** Mutasi keluar yang diajukan dari wilayah pengguna dan masih menunggu. */
export async function transfersOutgoing(user: SessionUser) {
  const ids = await scopedGudepIds(user);
  return baseQuery(await getDb())
    .where(and(eq(schema.memberTransfers.status, 'REQUESTED'), inScope(schema.memberTransfers.fromGudepId, ids)))
    .orderBy(desc(schema.memberTransfers.createdAt));
}

/** Keputusan terbaru yang menyentuh wilayah pengguna (asal atau tujuan). */
export async function transfersRecent(user: SessionUser, limit = 20) {
  const ids = await scopedGudepIds(user);
  const scope =
    ids === null ? undefined : or(inScope(schema.memberTransfers.fromGudepId, ids), inScope(schema.memberTransfers.toGudepId, ids));
  return baseQuery(await getDb())
    .where(and(ne(schema.memberTransfers.status, 'REQUESTED'), scope))
    .orderBy(desc(schema.memberTransfers.decidedAt))
    .limit(limit);
}

/** Semua gudep aktif sebagai tujuan mutasi (nama gudep bukan data rahasia). */
export async function transferTargetOptions(excludeGudepId: string) {
  const db = await getDb();
  return db
    .select({ id: schema.gudep.id, name: schema.gudep.name, kwarranName: schema.kwarran.name })
    .from(schema.gudep)
    .innerJoin(schema.kwarran, eq(schema.kwarran.id, schema.gudep.kwarranId))
    .where(and(eq(schema.gudep.active, true), ne(schema.gudep.id, excludeGudepId)))
    .orderBy(asc(schema.kwarran.name), asc(schema.gudep.name));
}
