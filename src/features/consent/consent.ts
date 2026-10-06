/**
 * SERVER-ONLY. Persetujuan wali terverifikasi (1.5).
 *
 * - Pembina/staf (izin members.update, dalam cakupannya) membuat kode sekali pakai.
 * - Wali memakai kode di /persetujuan-wali tanpa akun/email, memilih per cakupan.
 * - Staf HANYA bisa mencatat pencabutan; memberi persetujuan hanya bisa lewat kode wali.
 * Pemanggil (consent-actions.ts) menegakkan izin; fungsi di sini menegakkan cakupan & aturan.
 */
import { createHash } from 'node:crypto';
import { and, desc, eq, gt, inArray, isNull, sql } from 'drizzle-orm';
import { getDb, schema, type Database } from '@/db';
import type { ConsentScope } from '@/db/schema';
import { generateAccessCode, isValidAccessCodeShape, normalizeAccessCode } from '@/lib/auth/access-code';
import type { SessionUser } from '@/lib/auth/session';
import { memberScope } from '@/lib/auth/scope';
import { consentStatuses, firstNameOf, needsGuardianConsent, type ConsentDecision } from './status';
import { CONSENT_CODE_TTL_DAYS, CONSENT_SCOPES, CONSENT_TEXT_VERSION } from './texts';

export const hashConsentCode = (code: string) =>
  createHash('sha256')
    .update(`rp-consent:${normalizeAccessCode(code)}`)
    .digest('hex');

/** Anggota dalam cakupan aktor (null bila tidak ada / di luar cakupan — tidak dibedakan). */
async function memberInScope(d: Database, actor: SessionUser, memberId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(memberId)) return null;
  const [row] = await d
    .select({ id: schema.members.id, fullName: schema.members.fullName, birthDate: schema.members.birthDate })
    .from(schema.members)
    .innerJoin(schema.gudep, eq(schema.gudep.id, schema.members.gudepId))
    .where(and(eq(schema.members.id, memberId), memberScope(actor)))
    .limit(1);
  return row ?? null;
}

export type IssueResult = { ok: true; code: string; expiresAt: Date } | { ok: false; reason: 'tidak-ditemukan' | 'dewasa' };

/** Kode baru untuk wali; kode lama yang masih terbuka dibatalkan. */
export async function issueConsentRequest(actor: SessionUser, memberId: string, now = new Date(), db?: Database): Promise<IssueResult> {
  const d = db ?? (await getDb());
  const member = await memberInScope(d, actor, memberId);
  if (!member) return { ok: false, reason: 'tidak-ditemukan' };
  if (!needsGuardianConsent(member.birthDate, now)) return { ok: false, reason: 'dewasa' };
  const code = generateAccessCode();
  const expiresAt = new Date(now.getTime() + CONSENT_CODE_TTL_DAYS * 86_400_000);
  const t = schema.guardianConsentRequests;
  await d.transaction(async (tx) => {
    await tx
      .update(t)
      .set({ cancelledAt: now })
      .where(and(eq(t.memberId, member.id), isNull(t.usedAt), isNull(t.cancelledAt)));
    await tx
      .insert(t)
      .values({ memberId: member.id, codeHash: hashConsentCode(code), expiresAt, requestedById: actor.id, requestedByName: actor.name });
  });
  return { ok: true, code, expiresAt };
}

async function openRequestByCode(d: Database, code: string, now: Date) {
  if (!isValidAccessCodeShape(code)) return null;
  const t = schema.guardianConsentRequests;
  const [row] = await d
    .select({
      id: t.id,
      memberId: t.memberId,
      fullName: schema.members.fullName,
      gudepName: schema.gudep.name,
    })
    .from(t)
    .innerJoin(schema.members, eq(schema.members.id, t.memberId))
    .innerJoin(schema.gudep, eq(schema.gudep.id, schema.members.gudepId))
    .where(and(eq(t.codeHash, hashConsentCode(code)), isNull(t.usedAt), isNull(t.cancelledAt), gt(t.expiresAt, now)))
    .limit(1);
  return row ?? null;
}

/** Yang boleh dilihat pemegang kode: nama depan anak + gudep. Tidak ada data lain. */
export async function lookupConsentCode(code: string, now = new Date(), db?: Database) {
  const d = db ?? (await getDb());
  const req = await openRequestByCode(d, code, now);
  return req ? { childFirstName: firstNameOf(req.fullName), gudepName: req.gudepName } : null;
}

export interface GuardianSubmission {
  code: string;
  guardianName: string;
  decisions: Record<ConsentScope, boolean>;
  ipHash: string | null;
}

/** Catat keputusan wali. Kode diklaim atomik: dipakai serentak dua kali → hanya satu yang tercatat. */
export async function submitGuardianDecision(input: GuardianSubmission, now = new Date(), db?: Database) {
  const d = db ?? (await getDb());
  const req = await openRequestByCode(d, input.code, now);
  if (!req) return null;
  const t = schema.guardianConsentRequests;
  return d.transaction(async (tx) => {
    const claimed = await tx
      .update(t)
      .set({ usedAt: now })
      .where(and(eq(t.id, req.id), isNull(t.usedAt), isNull(t.cancelledAt), gt(t.expiresAt, now)))
      .returning({ id: t.id });
    if (claimed.length !== 1) return null;
    await tx.insert(schema.guardianConsents).values(
      CONSENT_SCOPES.map((scope) => ({
        memberId: req.memberId,
        requestId: req.id,
        scope,
        granted: input.decisions[scope],
        textVersion: CONSENT_TEXT_VERSION,
        method: 'GUARDIAN_CODE' as const,
        guardianName: input.guardianName,
        ipHash: input.ipHash,
        decidedAt: now,
      })),
    );
    return { memberId: req.memberId, childFirstName: firstNameOf(req.fullName) };
  });
}

/**
 * Staf mencatat pencabutan atas permintaan wali. Sengaja tidak menerima `granted`:
 * staf tidak punya jalur apa pun untuk MEMBERI persetujuan atas nama wali.
 */
export async function recordStaffRevocation(
  actor: SessionUser,
  memberId: string,
  scope: ConsentScope,
  note: string,
  now = new Date(),
  db?: Database,
) {
  const d = db ?? (await getDb());
  const member = await memberInScope(d, actor, memberId);
  if (!member) return null;
  await d.insert(schema.guardianConsents).values({
    memberId: member.id,
    scope,
    granted: false,
    textVersion: CONSENT_TEXT_VERSION,
    method: 'STAFF_REVOCATION',
    recordedById: actor.id,
    recordedByName: actor.name,
    note,
    decidedAt: now,
  });
  return member;
}

/** Riwayat + status terkini satu anggota (untuk halaman detail; cakupan dicek pemanggil lewat getMember). */
export async function memberConsentSummary(memberId: string, now = new Date(), db?: Database) {
  const d = db ?? (await getDb());
  const history = await d
    .select()
    .from(schema.guardianConsents)
    .where(eq(schema.guardianConsents.memberId, memberId))
    .orderBy(desc(schema.guardianConsents.decidedAt));
  const t = schema.guardianConsentRequests;
  const [open] = await d
    .select({ expiresAt: t.expiresAt, requestedByName: t.requestedByName, createdAt: t.createdAt })
    .from(t)
    .where(and(eq(t.memberId, memberId), isNull(t.usedAt), isNull(t.cancelledAt), gt(t.expiresAt, now)))
    .orderBy(desc(t.createdAt))
    .limit(1);
  return { statuses: consentStatuses(history), history, openRequest: open ?? null };
}

/** Status terkini untuk banyak anggota sekaligus (daftar pusat persetujuan, ekspor). */
export async function consentStatusesFor(memberIds: string[], db?: Database) {
  const d = db ?? (await getDb());
  if (memberIds.length === 0) return new Map<string, ReturnType<typeof consentStatuses>>();
  const rows = await d
    .select({
      memberId: schema.guardianConsents.memberId,
      scope: schema.guardianConsents.scope,
      granted: schema.guardianConsents.granted,
      method: schema.guardianConsents.method,
      decidedAt: schema.guardianConsents.decidedAt,
    })
    .from(schema.guardianConsents)
    .where(inArray(schema.guardianConsents.memberId, memberIds));
  const grouped = new Map<string, ConsentDecision[]>();
  for (const r of rows) grouped.set(r.memberId, [...(grouped.get(r.memberId) ?? []), r]);
  return new Map(memberIds.map((id) => [id, consentStatuses(grouped.get(id) ?? [])]));
}

/** Permintaan yang masih terbuka per anggota. */
export async function openRequestsFor(memberIds: string[], now = new Date(), db?: Database) {
  const d = db ?? (await getDb());
  if (memberIds.length === 0) return new Set<string>();
  const t = schema.guardianConsentRequests;
  const rows = await d
    .select({ memberId: t.memberId })
    .from(t)
    .where(and(inArray(t.memberId, memberIds), isNull(t.usedAt), isNull(t.cancelledAt), gt(t.expiresAt, now)));
  return new Set(rows.map((r) => r.memberId));
}

/** Batas tanggal lahir untuk "di bawah 18 tahun" (untuk filter SQL). */
export const minorBirthCutoff = (now = new Date()) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return sql`${`${now.getFullYear() - 18}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`}::date`;
};
