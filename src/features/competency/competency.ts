/**
 * SERVER-ONLY. SKU/SKK digital (2.3).
 *
 * - Daftar syarat = data referensi, dikelola pemegang `competency.manage` (tingkat Kwarcab).
 * - Verifikasi syarat seorang anggota: pemegang `competency.verify` DAN anggota dalam cakupannya.
 *   Pembatalan mengisi `revokedAt` (baris tidak dihapus); verifikasi ulang memakai baris yang sama.
 * - Kemajuan dilihat staf dalam cakupan (`members.read`) atau peserta untuk dirinya sendiri.
 *
 * Setiap fungsi menegakkan izin + cakupan baris sendiri (bukan hanya halaman/aksi pemanggil),
 * dan "tidak berizin" serta "di luar cakupan" dijawab sama: tidak ditemukan.
 */
import { and, asc, count, eq, isNotNull, isNull, ne, sql, type SQL } from 'drizzle-orm';
import { getDb, schema, type Database } from '@/db';
import type { CompetencyKind, Golongan, MemberStatus } from '@/db/schema';
import { roleCan } from '@/lib/auth/permissions';
import { memberScope } from '@/lib/auth/scope';
import type { SessionUser } from '@/lib/auth/session';
import { notify } from '@/features/notifications/notify';
import { summarizeProgress, type ProgressGroup } from './progress';
import { isUuid, type RequirementInput, type RequirementStatusFilter } from './validation';

const r = schema.competencyRequirements;
const mc = schema.memberCompetencies;

export type RequirementRow = typeof r.$inferSelect;

const db_ = async (db?: Database) => db ?? (await getDb());

/* ------------------------------------------------------------------ */
/* Data referensi: daftar syarat                                        */
/* ------------------------------------------------------------------ */

export interface RequirementFilters {
  golongan?: Golongan;
  kind?: CompetencyKind;
  level?: string;
  status?: RequirementStatusFilter;
  page?: number;
}

export const REQUIREMENTS_PAGE_SIZE = 50;

function requirementWhere(f: RequirementFilters): SQL | undefined {
  return and(
    f.golongan ? eq(r.golongan, f.golongan) : undefined,
    f.kind ? eq(r.kind, f.kind) : undefined,
    f.level ? eq(r.level, f.level) : undefined,
    f.status === 'semua' ? undefined : eq(r.active, f.status !== 'nonaktif'),
  );
}

/** Daftar syarat untuk halaman pengelolaan, beserta jumlah verifikasi yang berlaku per syarat. */
export async function listRequirements(actor: SessionUser, filters: RequirementFilters = {}, db?: Database) {
  const empty = { rows: [] as (RequirementRow & { verifiedCount: number })[], total: 0, page: 1, pageCount: 1 };
  if (!roleCan(actor.role, 'competency.manage')) return empty;
  const d = await db_(db);
  const where = requirementWhere(filters);
  const [{ n: total }] = await d.select({ n: count() }).from(r).where(where);
  const pageCount = Math.max(1, Math.ceil(total / REQUIREMENTS_PAGE_SIZE));
  const page = Math.min(Math.max(1, Math.floor(filters.page ?? 1)), pageCount);
  const used = d
    .select({ requirementId: mc.requirementId, n: sql<number>`count(*)::int`.as('n') })
    .from(mc)
    .where(isNull(mc.revokedAt))
    .groupBy(mc.requirementId)
    .as('used');
  const rows = await d
    .select({ req: r, verifiedCount: sql<number>`coalesce(${used.n}, 0)`.mapWith(Number) })
    .from(r)
    .leftJoin(used, eq(used.requirementId, r.id))
    .where(where)
    .orderBy(asc(r.golongan), asc(r.kind), asc(r.sortOrder), asc(r.code))
    .limit(REQUIREMENTS_PAGE_SIZE)
    .offset((page - 1) * REQUIREMENTS_PAGE_SIZE);
  return { rows: rows.map((x) => ({ ...x.req, verifiedCount: x.verifiedCount })), total, page, pageCount };
}

/** Tingkatan yang sudah dipakai (untuk filter & saran isian). */
export async function requirementLevels(actor: SessionUser, f: { golongan?: Golongan; kind?: CompetencyKind } = {}, db?: Database) {
  if (!roleCan(actor.role, 'competency.manage')) return [];
  const d = await db_(db);
  const rows = await d
    .selectDistinct({ level: r.level })
    .from(r)
    .where(and(f.golongan ? eq(r.golongan, f.golongan) : undefined, f.kind ? eq(r.kind, f.kind) : undefined))
    .orderBy(asc(r.level));
  return rows.map((x) => x.level);
}

export async function getRequirement(actor: SessionUser, id: string, db?: Database): Promise<RequirementRow | null> {
  if (!roleCan(actor.role, 'competency.manage') || !isUuid(id)) return null;
  const d = await db_(db);
  const [row] = await d.select().from(r).where(eq(r.id, id)).limit(1);
  return row ?? null;
}

export type SaveRequirementResult =
  { ok: true; id: string } | { ok: false; reason: 'tidak-ditemukan' | 'kode-dipakai' | 'golongan-terkunci' };

const isUniqueViolation = (err: unknown) => {
  const e = err as { code?: string; cause?: { code?: string } } | null;
  return e?.code === '23505' || e?.cause?.code === '23505';
};

/**
 * Buat (`id` null) atau ubah syarat. Kode unik (huruf besar). Golongan tidak dapat diubah
 * setelah ada verifikasi untuk syarat itu: verifikasi lama akan "hilang" dari kemajuan anggota.
 */
export async function saveRequirement(
  actor: SessionUser,
  id: string | null,
  input: RequirementInput,
  db?: Database,
): Promise<SaveRequirementResult> {
  if (!roleCan(actor.role, 'competency.manage')) return { ok: false, reason: 'tidak-ditemukan' };
  if (id !== null && !isUuid(id)) return { ok: false, reason: 'tidak-ditemukan' };
  const d = await db_(db);
  const values = { ...input, code: input.code.toUpperCase() };

  const [dup] = await d
    .select({ id: r.id })
    .from(r)
    .where(and(eq(r.code, values.code), id ? ne(r.id, id) : undefined))
    .limit(1);
  if (dup) return { ok: false, reason: 'kode-dipakai' };

  try {
    if (id) {
      const [current] = await d.select({ golongan: r.golongan }).from(r).where(eq(r.id, id)).limit(1);
      if (!current) return { ok: false, reason: 'tidak-ditemukan' };
      if (current.golongan !== values.golongan) {
        const [used] = await d.select({ id: mc.id }).from(mc).where(eq(mc.requirementId, id)).limit(1);
        if (used) return { ok: false, reason: 'golongan-terkunci' };
      }
      await d.update(r).set(values).where(eq(r.id, id));
      return { ok: true, id };
    }
    const [row] = await d.insert(r).values(values).returning({ id: r.id });
    return { ok: true, id: row.id };
  } catch (err) {
    if (isUniqueViolation(err)) return { ok: false, reason: 'kode-dipakai' };
    throw err;
  }
}

/** Aktifkan/nonaktifkan. Syarat nonaktif tidak dihitung di kemajuan dan tidak bisa diverifikasi. */
export async function setRequirementActive(actor: SessionUser, id: string, active: boolean, db?: Database) {
  if (!roleCan(actor.role, 'competency.manage') || !isUuid(id)) return null;
  const d = await db_(db);
  const [row] = await d.update(r).set({ active }).where(eq(r.id, id)).returning({ id: r.id, code: r.code, active: r.active });
  return row ?? null;
}

/* ------------------------------------------------------------------ */
/* Kemajuan anggota                                                     */
/* ------------------------------------------------------------------ */

interface ScopedMember {
  id: string;
  fullName: string;
  golongan: Golongan;
  status: MemberStatus;
  gudepId: string;
  anonymizedAt: Date | null;
}

/** Anggota dalam cakupan staf (null bila tidak ada / di luar cakupan — tidak dibedakan). */
async function memberInScope(d: Database, actor: SessionUser, memberId: string): Promise<ScopedMember | null> {
  if (!isUuid(memberId)) return null;
  const [row] = await d
    .select({
      id: schema.members.id,
      fullName: schema.members.fullName,
      golongan: schema.members.golongan,
      status: schema.members.status,
      gudepId: schema.members.gudepId,
      anonymizedAt: schema.members.anonymizedAt,
    })
    .from(schema.members)
    .innerJoin(schema.gudep, eq(schema.gudep.id, schema.members.gudepId))
    .where(and(eq(schema.members.id, memberId), memberScope(actor)))
    .limit(1);
  return row ?? null;
}

export interface MemberProgress {
  member: { id: string; golongan: Golongan; status: MemberStatus; gudepId: string };
  groups: ProgressGroup[];
  /** Aktor boleh memverifikasi/membatalkan untuk anggota ini (izin + cakupan + status). */
  canVerify: boolean;
  /** Peserta yang melihat dirinya sendiri: hanya-baca, tanpa catatan internal pembina. */
  self: boolean;
}

/**
 * Kemajuan SKU/SKK anggota untuk golongannya saat ini. Staf: `members.read` + cakupan.
 * Peserta: hanya dirinya sendiri (`self.portal` + `memberId` akun). Selain itu null.
 */
export async function memberProgress(actor: SessionUser, memberId: string, db?: Database): Promise<MemberProgress | null> {
  if (!isUuid(memberId)) return null;
  const self = actor.role === 'PESERTA' && roleCan(actor.role, 'self.portal') && actor.memberId === memberId;
  if (!self && !roleCan(actor.role, 'members.read')) return null;
  const d = await db_(db);
  const member = self
    ? ((
        await d
          .select({
            id: schema.members.id,
            fullName: schema.members.fullName,
            golongan: schema.members.golongan,
            status: schema.members.status,
            gudepId: schema.members.gudepId,
            anonymizedAt: schema.members.anonymizedAt,
          })
          .from(schema.members)
          .where(eq(schema.members.id, memberId))
          .limit(1)
      )[0] ?? null)
    : await memberInScope(d, actor, memberId);
  if (!member) return null;

  const [requirements, verifications] = await Promise.all([
    d
      .select()
      .from(r)
      .where(and(eq(r.golongan, member.golongan), eq(r.active, true))),
    d
      .select({
        requirementId: mc.requirementId,
        verifiedAt: mc.verifiedAt,
        verifiedByName: mc.verifiedByName,
        note: mc.note,
        revokedAt: mc.revokedAt,
        revokedByName: mc.revokedByName,
      })
      .from(mc)
      .where(eq(mc.memberId, member.id)),
  ]);

  // Catatan pembina bersifat internal: peserta hanya melihat tanggal & nama pemverifikasi.
  const visible = self ? verifications.map((v) => ({ ...v, note: null })) : verifications;
  return {
    member: { id: member.id, golongan: member.golongan, status: member.status, gudepId: member.gudepId },
    groups: summarizeProgress(member.golongan, requirements, visible),
    canVerify: !self && roleCan(actor.role, 'competency.verify') && member.status !== 'ARCHIVED' && !member.anonymizedAt,
    self,
  };
}

/* ------------------------------------------------------------------ */
/* Verifikasi & pembatalan                                              */
/* ------------------------------------------------------------------ */

export type VerifyFailure = 'tidak-ditemukan' | 'nonaktif' | 'tidak-berlaku' | 'sudah' | 'belum';
export type VerifyResult = { ok: true; memberName: string; code: string; title: string } | { ok: false; reason: VerifyFailure };

/** Izin + cakupan + status anggota. Diarsipkan = nonaktif; dianonimkan = tidak ditemukan. */
async function verifiableMember(
  d: Database,
  actor: SessionUser,
  memberId: string,
): Promise<{ ok: true; member: ScopedMember } | { ok: false; reason: VerifyFailure }> {
  if (!roleCan(actor.role, 'competency.verify')) return { ok: false, reason: 'tidak-ditemukan' };
  const member = await memberInScope(d, actor, memberId);
  if (!member || member.anonymizedAt) return { ok: false, reason: 'tidak-ditemukan' };
  if (member.status === 'ARCHIVED') return { ok: false, reason: 'nonaktif' };
  return { ok: true, member };
}

/**
 * Tandai satu syarat terverifikasi. Syarat harus aktif dan untuk golongan anggota.
 * Atomik terhadap verifikasi ganda: baris yang masih berlaku tidak ditimpa (`sudah`);
 * baris yang pernah dibatalkan dipakai ulang dengan pemverifikasi & tanggal baru.
 */
export async function verifyRequirement(
  actor: SessionUser,
  memberId: string,
  requirementId: string,
  note: string | null,
  now = new Date(),
  db?: Database,
): Promise<VerifyResult> {
  const d = await db_(db);
  const check = await verifiableMember(d, actor, memberId);
  if (!check.ok) return check;
  const { member } = check;
  if (!isUuid(requirementId)) return { ok: false, reason: 'tidak-berlaku' };
  const [req] = await d.select().from(r).where(eq(r.id, requirementId)).limit(1);
  if (!req || !req.active || req.golongan !== member.golongan) return { ok: false, reason: 'tidak-berlaku' };

  const fields = { verifiedAt: now, verifiedById: actor.id, verifiedByName: actor.name, note, revokedAt: null, revokedByName: null };
  const [row] = await d
    .insert(mc)
    .values({ memberId: member.id, requirementId: req.id, ...fields })
    .onConflictDoUpdate({ target: [mc.memberId, mc.requirementId], set: fields, setWhere: isNotNull(mc.revokedAt) })
    .returning({ id: mc.id });
  if (!row) return { ok: false, reason: 'sudah' };

  // Kabar untuk akun portal peserta: hanya kode & judul syarat (bukan catatan pembina).
  const owners = await d
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(and(eq(schema.users.memberId, member.id), eq(schema.users.role, 'PESERTA')));
  if (owners.length > 0) {
    await notify(
      {
        kind: 'SYSTEM',
        priority: 'LOW',
        title: `Syarat ${req.kind} terverifikasi`,
        body: `${req.code} — ${req.title}`,
        href: '/dashboard/profil',
        recipients: { userIds: owners.map((o) => o.id) },
        dedupeKey: `competency:${row.id}:${now.getTime()}`,
        excludeUserId: actor.id,
      },
      d,
    );
  }
  return { ok: true, memberName: member.fullName, code: req.code, title: req.title };
}

/**
 * Batalkan verifikasi (salah catat). `note` menggantikan catatan sebelumnya sehingga catatan
 * selalu menjelaskan tindakan terakhir; riwayat tindakan ada di log audit.
 */
export async function revokeVerification(
  actor: SessionUser,
  memberId: string,
  requirementId: string,
  note: string | null,
  now = new Date(),
  db?: Database,
): Promise<VerifyResult> {
  const d = await db_(db);
  const check = await verifiableMember(d, actor, memberId);
  if (!check.ok) return check;
  const { member } = check;
  if (!isUuid(requirementId)) return { ok: false, reason: 'belum' };
  const [row] = await d
    .update(mc)
    .set({ revokedAt: now, revokedByName: actor.name, note })
    .where(and(eq(mc.memberId, member.id), eq(mc.requirementId, requirementId), isNull(mc.revokedAt)))
    .returning({ id: mc.id });
  if (!row) return { ok: false, reason: 'belum' };
  const [req] = await d.select({ code: r.code, title: r.title }).from(r).where(eq(r.id, requirementId)).limit(1);
  return { ok: true, memberName: member.fullName, code: req?.code ?? '', title: req?.title ?? '' };
}
