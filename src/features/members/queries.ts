/**
 * Query anggota untuk portal. SETIAP fungsi menerima pengguna dan menerapkan cakupannya;
 * tidak ada jalur baca data anggota yang melewati `memberScope`.
 */
import { aliasedTable, and, asc, count, eq, ilike, ne, or, sql, type SQL } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import type { Golongan, MemberStatus } from '@/db/schema';
import { gudepScope, memberScope } from '@/lib/auth/scope';
import type { SessionUser } from '@/lib/auth/session';

export const PAGE_SIZE = 25;

export interface MemberFilters {
  q?: string;
  gudepId?: string;
  kwarranId?: string;
  golongan?: Golongan;
  status?: MemberStatus;
  page?: number;
}

function filterConditions(user: SessionUser, f: MemberFilters): SQL | undefined {
  const conds: (SQL | undefined)[] = [memberScope(user)];
  if (f.q) {
    const like = `%${f.q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
    conds.push(or(ilike(schema.members.fullName, like), ilike(schema.members.kta, like)));
  }
  if (f.gudepId) conds.push(eq(schema.members.gudepId, f.gudepId));
  if (f.kwarranId) conds.push(eq(schema.gudep.kwarranId, f.kwarranId));
  if (f.golongan) conds.push(eq(schema.members.golongan, f.golongan));
  // Arsip disembunyikan kecuali diminta eksplisit.
  conds.push(f.status ? eq(schema.members.status, f.status) : ne(schema.members.status, 'ARCHIVED'));
  return and(...conds);
}

export async function listMembers(user: SessionUser, f: MemberFilters) {
  const db = await getDb();
  const where = filterConditions(user, f);
  const page = Math.max(1, f.page ?? 1);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: schema.members.id,
        fullName: schema.members.fullName,
        kta: schema.members.kta,
        gender: schema.members.gender,
        birthDate: schema.members.birthDate,
        golongan: schema.members.golongan,
        status: schema.members.status,
        updatedAt: schema.members.updatedAt,
        gudepId: schema.gudep.id,
        gudepName: schema.gudep.name,
        gudepNumber: schema.gudep.number,
        kwarranName: schema.kwarran.name,
      })
      .from(schema.members)
      .innerJoin(schema.gudep, eq(schema.gudep.id, schema.members.gudepId))
      .innerJoin(schema.kwarran, eq(schema.kwarran.id, schema.gudep.kwarranId))
      .where(where)
      .orderBy(
        // Yang butuh tindakan tampil paling atas.
        sql`case ${schema.members.status} when 'NEEDS_FIX' then 0 when 'PENDING' then 1 else 2 end`,
        asc(schema.members.fullName),
      )
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ total: count() })
      .from(schema.members)
      .innerJoin(schema.gudep, eq(schema.gudep.id, schema.members.gudepId))
      .where(where),
  ]);

  return { rows, total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/** Semua baris sesuai filter (tanpa paginasi) — untuk ekspor. */
export async function listMembersForExport(user: SessionUser, f: MemberFilters) {
  const db = await getDb();
  return db
    .select({ m: schema.members, gudepName: schema.gudep.name, gudepNumber: schema.gudep.number, kwarranName: schema.kwarran.name })
    .from(schema.members)
    .innerJoin(schema.gudep, eq(schema.gudep.id, schema.members.gudepId))
    .innerJoin(schema.kwarran, eq(schema.kwarran.id, schema.gudep.kwarranId))
    .where(filterConditions(user, f))
    .orderBy(asc(schema.kwarran.name), asc(schema.gudep.name), asc(schema.members.fullName));
}

const verifier = aliasedTable(schema.users, 'verifier');
const portalUser = aliasedTable(schema.users, 'portal_user');

/** Detail satu anggota, atau null bila tidak ada ATAU di luar cakupan (tidak dibedakan). */
export async function getMember(user: SessionUser, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = await getDb();
  const [row] = await db
    .select({
      m: schema.members,
      gudep: schema.gudep,
      kwarranName: schema.kwarran.name,
      verifiedByName: verifier.name,
      portalUsername: portalUser.username,
      portalUserId: portalUser.id,
      portalActive: portalUser.active,
    })
    .from(schema.members)
    .innerJoin(schema.gudep, eq(schema.gudep.id, schema.members.gudepId))
    .innerJoin(schema.kwarran, eq(schema.kwarran.id, schema.gudep.kwarranId))
    .leftJoin(verifier, eq(verifier.id, schema.members.verifiedById))
    .leftJoin(portalUser, eq(portalUser.memberId, schema.members.id))
    .where(and(eq(schema.members.id, id), memberScope(user)))
    .limit(1);
  return row ?? null;
}

/** Jumlah anggota per status dalam cakupan — untuk daftar tugas di ringkasan. */
export async function memberStatusCounts(user: SessionUser): Promise<Record<MemberStatus, number>> {
  const db = await getDb();
  const rows = await db
    .select({ status: schema.members.status, n: count() })
    .from(schema.members)
    .innerJoin(schema.gudep, eq(schema.gudep.id, schema.members.gudepId))
    .where(memberScope(user))
    .groupBy(schema.members.status);
  const out: Record<MemberStatus, number> = { PENDING: 0, ACTIVE: 0, NEEDS_FIX: 0, ARCHIVED: 0 };
  for (const r of rows) out[r.status] = r.n;
  return out;
}

export async function golonganCounts(user: SessionUser, gudepId?: string) {
  const db = await getDb();
  return db
    .select({ golongan: schema.members.golongan, n: count() })
    .from(schema.members)
    .innerJoin(schema.gudep, eq(schema.gudep.id, schema.members.gudepId))
    .where(and(memberScope(user), eq(schema.members.status, 'ACTIVE'), gudepId ? eq(schema.members.gudepId, gudepId) : undefined))
    .groupBy(schema.members.golongan);
}

/**
 * Kemungkinan data ganda: nama sama (tanpa beda huruf besar/kecil & spasi) DAN tanggal lahir sama,
 * di gudep mana pun. Di luar cakupan hanya dilaporkan jumlahnya, bukan isinya.
 */
export async function findDuplicates(user: SessionUser, fullName: string, birthDate: string, excludeId?: string) {
  const db = await getDb();
  const normalized = fullName.trim().replace(/\s+/g, ' ').toLowerCase();
  const rows = await db
    .select({ id: schema.members.id, gudepId: schema.members.gudepId, gudepName: schema.gudep.name, kwarranId: schema.gudep.kwarranId })
    .from(schema.members)
    .innerJoin(schema.gudep, eq(schema.gudep.id, schema.members.gudepId))
    .where(
      and(
        sql`lower(regexp_replace(trim(${schema.members.fullName}), '\\s+', ' ', 'g')) = ${normalized}`,
        eq(schema.members.birthDate, birthDate),
        ne(schema.members.status, 'ARCHIVED'),
        excludeId ? ne(schema.members.id, excludeId) : undefined,
      ),
    );
  const visible = rows.filter((r) => {
    switch (user.role) {
      case 'SUPER_ADMIN':
      case 'ADMIN_KWARCAB':
        return true;
      case 'STAFF_KWARRAN':
        return r.kwarranId === user.kwarranId;
      case 'STAFF_GUDEP':
        return r.gudepId === user.gudepId;
      default:
        return false;
    }
  });
  return { visible, hiddenCount: rows.length - visible.length };
}

/** Pilihan gudep dalam cakupan untuk formulir & filter. */
export async function gudepOptions(user: SessionUser) {
  const db = await getDb();
  return db
    .select({ id: schema.gudep.id, name: schema.gudep.name, number: schema.gudep.number, kwarranName: schema.kwarran.name })
    .from(schema.gudep)
    .innerJoin(schema.kwarran, eq(schema.kwarran.id, schema.gudep.kwarranId))
    .where(and(gudepScope(user), eq(schema.gudep.active, true)))
    .orderBy(asc(schema.kwarran.name), asc(schema.gudep.name));
}

export async function recentMembers(user: SessionUser, limit = 5) {
  const db = await getDb();
  return db
    .select({ id: schema.members.id, fullName: schema.members.fullName, status: schema.members.status, gudepName: schema.gudep.name, updatedAt: schema.members.updatedAt })
    .from(schema.members)
    .innerJoin(schema.gudep, eq(schema.gudep.id, schema.members.gudepId))
    .where(and(memberScope(user), or(eq(schema.members.status, 'PENDING'), eq(schema.members.status, 'NEEDS_FIX'))))
    .orderBy(asc(schema.members.updatedAt))
    .limit(limit);
}

