/**
 * SERVER-ONLY. Ekspor rekap kemajuan SKU/SKK (2.3) untuk anggota dalam cakupan.
 * Satu baris per anggota per kelompok (jenis + tingkatan). Hanya kolom non-sensitif: tanpa
 * kontak, alamat, data wali, tanggal lahir, atau catatan pembina. CSV aman injeksi (lib/csv).
 */
import { and, asc, eq, isNull, ne } from 'drizzle-orm';
import { getDb, schema, type Database } from '@/db';
import { roleCan } from '@/lib/auth/permissions';
import { gudepScope, memberScope } from '@/lib/auth/scope';
import type { SessionUser } from '@/lib/auth/session';
import { toCsv } from '@/lib/csv';
import { golonganLabel } from '@/lib/domain';
import { summarizeProgress, type VerificationLike } from './progress';
import { KIND_LABELS, isUuid } from './validation';

export const PROGRESS_CSV_HEADER = [
  'No KTA',
  'Nama Lengkap',
  'Golongan',
  'Gudep',
  'No Gudep',
  'Kwarran',
  'Jenis',
  'Tingkatan',
  'Terverifikasi',
  'Jumlah Syarat',
  'Persentase',
  'Verifikasi Terakhir',
];

const wibDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' });

export interface ProgressExport {
  csv: string;
  memberCount: number;
  gudep: { id: string; name: string } | null;
}

/**
 * null = tidak berizin (`competency.verify`) atau gudep di luar cakupan / tidak ada — pemanggil
 * menjawab 404 tanpa membedakan keduanya. Tanpa `gudepId` = seluruh anggota dalam cakupan.
 * Anggota yang diarsipkan atau dianonimkan tidak ikut.
 */
export async function progressExport(actor: SessionUser, opts: { gudepId?: string | null }, db?: Database): Promise<ProgressExport | null> {
  if (!roleCan(actor.role, 'competency.verify')) return null;
  const d = db ?? (await getDb());

  let gudep: ProgressExport['gudep'] = null;
  if (opts.gudepId) {
    if (!isUuid(opts.gudepId)) return null;
    const [g] = await d
      .select({ id: schema.gudep.id, name: schema.gudep.name })
      .from(schema.gudep)
      .where(and(eq(schema.gudep.id, opts.gudepId), gudepScope(actor)))
      .limit(1);
    if (!g) return null;
    gudep = g;
  }

  const m = schema.members;
  const memberWhere = and(
    memberScope(actor),
    gudep ? eq(m.gudepId, gudep.id) : undefined,
    ne(m.status, 'ARCHIVED'),
    isNull(m.anonymizedAt),
  );

  const [members, requirements, verifications] = await Promise.all([
    d
      .select({
        id: m.id,
        kta: m.kta,
        fullName: m.fullName,
        golongan: m.golongan,
        gudepName: schema.gudep.name,
        gudepNumber: schema.gudep.number,
        kwarranName: schema.kwarran.name,
      })
      .from(m)
      .innerJoin(schema.gudep, eq(schema.gudep.id, m.gudepId))
      .innerJoin(schema.kwarran, eq(schema.kwarran.id, schema.gudep.kwarranId))
      .where(memberWhere)
      .orderBy(asc(schema.kwarran.name), asc(schema.gudep.name), asc(m.fullName)),
    d.select().from(schema.competencyRequirements).where(eq(schema.competencyRequirements.active, true)),
    // Join dengan kondisi cakupan yang sama (bukan daftar id): tidak ada batas jumlah parameter.
    d
      .select({
        memberId: schema.memberCompetencies.memberId,
        requirementId: schema.memberCompetencies.requirementId,
        verifiedAt: schema.memberCompetencies.verifiedAt,
        verifiedByName: schema.memberCompetencies.verifiedByName,
        note: schema.memberCompetencies.note,
        revokedAt: schema.memberCompetencies.revokedAt,
        revokedByName: schema.memberCompetencies.revokedByName,
      })
      .from(schema.memberCompetencies)
      .innerJoin(m, eq(m.id, schema.memberCompetencies.memberId))
      .innerJoin(schema.gudep, eq(schema.gudep.id, m.gudepId))
      .where(and(memberWhere, isNull(schema.memberCompetencies.revokedAt))),
  ]);

  const byMember = new Map<string, VerificationLike[]>();
  for (const v of verifications) {
    const list = byMember.get(v.memberId) ?? [];
    list.push({ ...v, note: null });
    byMember.set(v.memberId, list);
  }

  const rows: unknown[][] = [];
  for (const mem of members) {
    const base = [mem.kta, mem.fullName, golonganLabel(mem.golongan), mem.gudepName, mem.gudepNumber, mem.kwarranName];
    const groups = summarizeProgress(mem.golongan, requirements, byMember.get(mem.id) ?? []);
    if (groups.length === 0) {
      rows.push([...base, '', 'Belum ada syarat aktif', 0, 0, '0%', '']);
      continue;
    }
    for (const g of groups) {
      rows.push([
        ...base,
        KIND_LABELS[g.kind],
        g.level,
        g.verified,
        g.total,
        `${g.percent}%`,
        g.lastVerifiedAt ? wibDate.format(g.lastVerifiedAt) : '',
      ]);
    }
  }

  return { csv: toCsv(PROGRESS_CSV_HEADER, rows), memberCount: members.length, gudep };
}
