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

export interface StatTile {
  label: string;
  value: string;
  note: string;
}

const number = (n: number) => new Intl.NumberFormat('id-ID').format(n);

/** Angka beranda. Baris bernilai nol disembunyikan agar situs baru tidak tampak kosong. */
export async function getHomeStats(): Promise<StatTile[]> {
  const s = await getStatSummary();
  const tiles: (StatTile & { raw: number })[] = [
    { raw: s.totalKwarran, label: 'Kwartir Ranting', value: number(s.totalKwarran), note: 'Seluruh kecamatan' },
    { raw: s.totalGudep, label: 'Gugus Depan', value: number(s.totalGudep), note: 'Pangkalan aktif terdata' },
    { raw: s.totalMembers, label: 'Anggota aktif', value: number(s.totalMembers), note: 'Terverifikasi kwartir' },
    { raw: s.totalActivities, label: `Kegiatan ${new Date().getFullYear()}`, value: number(s.totalActivities), note: 'Agenda resmi' },
  ];
  return tiles.filter((t) => t.raw > 0).map(({ raw: _raw, ...t }) => t);
}
