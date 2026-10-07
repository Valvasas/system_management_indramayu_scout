import { and, asc, count, eq, ilike, isNotNull, isNull, or, sql, type SQL } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { gudepScope } from '@/lib/auth/scope';
import type { SessionUser } from '@/lib/auth/session';

export const GUDEP_PAGE_SIZE = 30;

export interface GudepFilters {
  q?: string;
  kwarranId?: string;
  /** 'tanpa-lokasi' = hanya gudep yang belum punya titik peta. */
  lokasi?: 'ada' | 'tanpa';
  page?: number;
}

const activeMembers = () =>
  sql<number>`(select count(*) from ${schema.members} where ${schema.members.gudepId} = ${schema.gudep.id} and ${schema.members.status} = 'ACTIVE')`.mapWith(
    Number,
  );
const pendingMembers = () =>
  sql<number>`(select count(*) from ${schema.members} where ${schema.members.gudepId} = ${schema.gudep.id} and ${schema.members.status} in ('PENDING','NEEDS_FIX'))`.mapWith(
    Number,
  );

function conditions(user: SessionUser, f: GudepFilters): SQL | undefined {
  const conds: (SQL | undefined)[] = [gudepScope(user)];
  if (f.q) {
    const like = `%${f.q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
    conds.push(or(ilike(schema.gudep.name, like), ilike(schema.gudep.number, like), ilike(schema.gudep.pangkalan, like)));
  }
  if (f.kwarranId) conds.push(eq(schema.gudep.kwarranId, f.kwarranId));
  if (f.lokasi === 'tanpa') conds.push(or(isNull(schema.gudep.lat), isNull(schema.gudep.lng)));
  if (f.lokasi === 'ada') conds.push(and(isNotNull(schema.gudep.lat), isNotNull(schema.gudep.lng)));
  return and(...conds);
}

export async function listGudep(user: SessionUser, f: GudepFilters) {
  const db = await getDb();
  const where = conditions(user, f);
  const page = Math.max(1, f.page ?? 1);
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: schema.gudep.id,
        name: schema.gudep.name,
        number: schema.gudep.number,
        jenjang: schema.gudep.jenjang,
        active: schema.gudep.active,
        lat: schema.gudep.lat,
        lng: schema.gudep.lng,
        kwarranName: schema.kwarran.name,
        activeMembers: activeMembers(),
        pendingMembers: pendingMembers(),
      })
      .from(schema.gudep)
      .innerJoin(schema.kwarran, eq(schema.kwarran.id, schema.gudep.kwarranId))
      .where(where)
      .orderBy(asc(schema.kwarran.name), asc(schema.gudep.name))
      .limit(GUDEP_PAGE_SIZE)
      .offset((page - 1) * GUDEP_PAGE_SIZE),
    db.select({ total: count() }).from(schema.gudep).where(where),
  ]);
  return { rows, total, page, pageCount: Math.max(1, Math.ceil(total / GUDEP_PAGE_SIZE)) };
}

/** Titik peta semua gudep dalam cakupan (tanpa paginasi). */
export async function gudepMapPoints(user: SessionUser, kwarranId?: string) {
  const db = await getDb();
  return db
    .select({
      id: schema.gudep.id,
      name: schema.gudep.name,
      number: schema.gudep.number,
      lat: schema.gudep.lat,
      lng: schema.gudep.lng,
      kwarranName: schema.kwarran.name,
      activeMembers: activeMembers(),
    })
    .from(schema.gudep)
    .innerJoin(schema.kwarran, eq(schema.kwarran.id, schema.gudep.kwarranId))
    .where(
      and(
        gudepScope(user),
        isNotNull(schema.gudep.lat),
        isNotNull(schema.gudep.lng),
        kwarranId ? eq(schema.gudep.kwarranId, kwarranId) : undefined,
      ),
    )
    .then((rows) => rows.map((r) => ({ ...r, lat: r.lat as number, lng: r.lng as number })));
}

export async function getGudep(user: SessionUser, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = await getDb();
  const [row] = await db
    .select({ g: schema.gudep, kwarranName: schema.kwarran.name, activeMembers: activeMembers(), pendingMembers: pendingMembers() })
    .from(schema.gudep)
    .innerJoin(schema.kwarran, eq(schema.kwarran.id, schema.gudep.kwarranId))
    .where(and(eq(schema.gudep.id, id), gudepScope(user)))
    .limit(1);
  return row ?? null;
}

/** Kwarran yang boleh dipilih saat membuat/mengubah gudep. */
export async function kwarranOptions(user: SessionUser) {
  const db = await getDb();
  const rows = await db.select({ id: schema.kwarran.id, name: schema.kwarran.name }).from(schema.kwarran).orderBy(asc(schema.kwarran.name));
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN_KWARCAB') return rows;
  return rows.filter((k) => k.id === user.kwarranId);
}

export async function gudepLocationCoverage(user: SessionUser) {
  const db = await getDb();
  const [r] = await db
    .select({
      total: count(),
      located: sql<number>`count(*) filter (where ${schema.gudep.lat} is not null and ${schema.gudep.lng} is not null)`.mapWith(Number),
    })
    .from(schema.gudep)
    .where(and(gudepScope(user), eq(schema.gudep.active, true)));
  return r;
}
