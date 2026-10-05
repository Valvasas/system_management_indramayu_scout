import { and, count, eq, gte, lt } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import type { StatSummary } from '@/types';

/** Statistik agregat publik, dihitung langsung dari database (tidak ada angka karangan). */
export async function getStatSummary(): Promise<StatSummary> {
  const db = await getDb();
  const year = new Date().getFullYear();
  const [[kw], [gd], [active], [all], [ev]] = await Promise.all([
    db.select({ n: count() }).from(schema.kwarran),
    db.select({ n: count() }).from(schema.gudep).where(eq(schema.gudep.active, true)),
    db.select({ n: count() }).from(schema.members).where(eq(schema.members.status, 'ACTIVE')),
    db.select({ n: count() }).from(schema.members),
    db
      .select({ n: count() })
      .from(schema.events)
      .where(
        and(
          eq(schema.events.published, true),
          gte(schema.events.dateStart, new Date(year, 0, 1)),
          lt(schema.events.dateStart, new Date(year + 1, 0, 1)),
        ),
      ),
  ]);
  return {
    totalMembers: active.n,
    totalGudep: gd.n,
    totalKwarran: kw.n,
    totalActivities: ev.n,
    verifiedPercent: all.n ? Math.round((active.n / all.n) * 100) : 0,
  };
}

export interface GolonganCount {
  golongan: 'SIAGA' | 'PENGGALANG' | 'PENEGAK' | 'PANDEGA' | 'DEWASA';
  count: number;
}

/** Jumlah anggota AKTIF per golongan (agregat publik, V5 §11). */
export async function getActiveByGolongan(): Promise<GolonganCount[]> {
  const db = await getDb();
  const rows = await db
    .select({ golongan: schema.members.golongan, n: count() })
    .from(schema.members)
    .where(eq(schema.members.status, 'ACTIVE'))
    .groupBy(schema.members.golongan);
  return rows.map((r) => ({ golongan: r.golongan, count: r.n }));
}
