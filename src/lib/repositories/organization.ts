import { asc, count, eq, sql } from 'drizzle-orm';
import { getDb, schema, type Database } from '@/db';
import { currentTermWhere } from '@/features/terms/conditions';
import { wibToday } from '@/features/terms/dates';
import type { KwarranInfo, OrganizationMember } from '@/types';

/**
 * Pengurus yang SEDANG menjabat saja (2.4): aktif DAN (berakhir kosong ATAU berakhir ≥ hari ini
 * WIB) DAN (mulai kosong ATAU sudah mulai). Data lama tanpa tanggal tetap tampil (default aman).
 * Riwayat periode hanya di CMS (features/terms/board.ts).
 */
export async function getOrganizationMembers(now: Date = new Date(), db?: Database): Promise<OrganizationMember[]> {
  const d = db ?? (await getDb());
  const t = schema.boardMembers;
  const rows = await d
    .select()
    .from(t)
    .where(currentTermWhere(t, wibToday(now)))
    .orderBy(asc(t.sortOrder), asc(t.name));
  return rows.map((m) => ({
    id: m.id,
    name: m.name,
    role: m.position,
    department: m.department,
    period: m.period,
    photoUrl: '',
    bio: '',
  }));
}

/** Pengurus dikelompokkan per departemen, urutan mengikuti `sortOrder` pertama tiap departemen. */
export async function getOrganizationByDepartment(
  now: Date = new Date(),
  db?: Database,
): Promise<{ department: string; members: OrganizationMember[] }[]> {
  const groups = new Map<string, OrganizationMember[]>();
  for (const member of await getOrganizationMembers(now, db)) {
    const list = groups.get(member.department) ?? [];
    list.push(member);
    groups.set(member.department, list);
  }
  return Array.from(groups, ([department, members]) => ({ department, members }));
}

/** Daftar Kwarran publik: hanya angka agregat (jumlah gudep & anggota aktif), tanpa data pribadi. */
export async function getKwarran(): Promise<KwarranInfo[]> {
  const db = await getDb();
  const gudepCounts = db
    .select({ kwarranId: schema.gudep.kwarranId, n: count().as('gudep_n') })
    .from(schema.gudep)
    .where(eq(schema.gudep.active, true))
    .groupBy(schema.gudep.kwarranId)
    .as('gc');
  const memberCounts = db
    .select({ kwarranId: schema.gudep.kwarranId, n: count().as('member_n') })
    .from(schema.members)
    .innerJoin(schema.gudep, eq(schema.gudep.id, schema.members.gudepId))
    .where(eq(schema.members.status, 'ACTIVE'))
    .groupBy(schema.gudep.kwarranId)
    .as('mc');

  const rows = await db
    .select({
      k: schema.kwarran,
      gudepCount: sql<number>`coalesce(${gudepCounts.n}, 0)`.mapWith(Number),
      activeMembers: sql<number>`coalesce(${memberCounts.n}, 0)`.mapWith(Number),
    })
    .from(schema.kwarran)
    .leftJoin(gudepCounts, eq(gudepCounts.kwarranId, schema.kwarran.id))
    .leftJoin(memberCounts, eq(memberCounts.kwarranId, schema.kwarran.id))
    .orderBy(asc(schema.kwarran.name));

  return rows.map(({ k, gudepCount, activeMembers }) => ({
    id: k.id,
    name: k.name,
    code: k.code ?? '',
    gudepCount,
    activeMembers,
    address: k.address ?? '',
    leader: k.leaderName ?? '',
  }));
}
