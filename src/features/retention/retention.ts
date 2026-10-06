/**
 * SERVER-ONLY. Retensi data terjadwal (`npm run db:retention`, lihat docs/operations/retention.md).
 *
 * Dihapus permanen saat melewati masa simpan (dapat diatur lewat env, src/lib/env.ts):
 * sesi kedaluwarsa · kode akses terpakai/kedaluwarsa · permintaan reset & kode persetujuan
 * yang selesai/hangus · penghitung rate limit lewat jendela · pesan /kontak · log audit.
 *
 * Log audit INSERT-only: penghapusan hanya lewat transaksi yang menyalakan
 * `rumah_pramuka.audit_retention` DAN dijalankan peran pemilik skema (user aplikasi tidak
 * punya hak DELETE). Sebelum menghapus, prev_hash entri pertama yang tersisa dicatat sebagai
 * jangkar (audit_chain_anchors) supaya verifikasi rantai tetap lulus.
 */
import { and, asc, gte, isNotNull, isNull, lt, ne, or, sql, type SQL } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { schema, type Database } from '@/db';
import { appendAuditEntry } from '@/lib/auth/audit-chain';

export interface RetentionPolicy {
  accessCodesDays: number;
  resetRequestsDays: number;
  contactMessagesDays: number;
  auditLogMonths: number;
}

export interface RetentionReport {
  sessions: number;
  accessCodes: number;
  resetRequests: number;
  consentRequests: number;
  rateLimits: number;
  contactMessages: number;
  auditLogs: number | 'tidak-diizinkan';
}

const daysAgo = (now: Date, days: number) => new Date(now.getTime() - days * 86_400_000);
const monthsAgo = (now: Date, months: number) => {
  const d = new Date(now);
  d.setMonth(d.getMonth() - months);
  return d;
};

async function purgeAuditLogs(db: Database, cutoff: Date, dryRun: boolean): Promise<number | 'tidak-diizinkan'> {
  const t = schema.auditLogs;
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(t)
    .where(lt(t.at, cutoff));
  if (n === 0 || dryRun) return n;
  try {
    return await db.transaction(async (tx) => {
      await tx.execute(sql`SET LOCAL rumah_pramuka.audit_retention = 'on'`);
      // Entri berantai pertama yang tersisa → prev_hash-nya menjadi jangkar sah.
      const [first] = await tx
        .select({ id: t.id, prevHash: t.prevHash })
        .from(t)
        .where(and(gte(t.at, cutoff), isNotNull(t.hash)))
        .orderBy(asc(t.id))
        .limit(1);
      const deleted = await tx
        .delete(t)
        .where(first ? and(lt(t.at, cutoff), lt(t.id, first.id)) : lt(t.at, cutoff))
        .returning({ id: t.id });
      if (first?.prevHash && deleted.length > 0) {
        await tx.insert(schema.auditChainAnchors).values({ firstLogId: first.id, prevHash: first.prevHash, deletedCount: deleted.length });
      }
      return deleted.length;
    });
  } catch (err) {
    // Dijalankan dengan user aplikasi (tanpa hak DELETE): bagian lain tetap jalan.
    if (/permission denied|insufficient_privilege|hanya boleh ditambah/i.test(String((err as Error & { cause?: Error }).cause ?? err)))
      return 'tidak-diizinkan';
    throw err;
  }
}

export async function runRetention(
  db: Database,
  policy: RetentionPolicy,
  opts: { now?: Date; dryRun?: boolean } = {},
): Promise<RetentionReport> {
  const now = opts.now ?? new Date();
  const dry = Boolean(opts.dryRun);
  const purge = async (table: PgTable, where: SQL | undefined) => {
    if (dry) {
      const [{ n }] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(table)
        .where(where);
      return n;
    }
    const rows = await db
      .delete(table)
      .where(where)
      .returning({ one: sql`1` });
    return rows.length;
  };

  const codeCutoff = daysAgo(now, policy.accessCodesDays);
  const report: RetentionReport = {
    sessions: await purge(schema.sessions, lt(schema.sessions.expiresAt, now)),
    accessCodes: await purge(
      schema.accessCodes,
      or(lt(schema.accessCodes.usedAt, codeCutoff), lt(schema.accessCodes.expiresAt, codeCutoff)),
    ),
    resetRequests: await purge(
      schema.passwordResetRequests,
      and(
        ne(schema.passwordResetRequests.status, 'OPEN'),
        lt(schema.passwordResetRequests.createdAt, daysAgo(now, policy.resetRequestsDays)),
      ),
    ),
    // Permintaan yang SUDAH dipakai disimpan sebagai bukti asal persetujuan; yang hangus/dibatalkan dihapus.
    consentRequests: await purge(
      schema.guardianConsentRequests,
      and(
        isNull(schema.guardianConsentRequests.usedAt),
        or(lt(schema.guardianConsentRequests.expiresAt, codeCutoff), lt(schema.guardianConsentRequests.cancelledAt, codeCutoff)),
      ),
    ),
    rateLimits: await purge(schema.rateLimits, lt(schema.rateLimits.windowEndsAt, now)),
    contactMessages: await purge(schema.contactMessages, lt(schema.contactMessages.createdAt, daysAgo(now, policy.contactMessagesDays))),
    auditLogs: await purgeAuditLogs(db, monthsAgo(now, policy.auditLogMonths), dry),
  };

  if (!dry) {
    await appendAuditEntry(db, {
      userId: null,
      actorName: 'Sistem',
      action: 'retention.run',
      summary: `Retensi: sesi ${report.sessions}, kode akses ${report.accessCodes}, permintaan reset ${report.resetRequests}, kode persetujuan ${report.consentRequests}, rate limit ${report.rateLimits}, pesan kontak ${report.contactMessages}, log audit ${report.auditLogs}`,
      entityType: null,
      entityId: null,
      ip: null,
    });
  }
  return report;
}

/** Kebijakan dari env (nilai bawaan di src/lib/env.ts). */
export function policyFromEnv(env: {
  RETENTION_ACCESS_CODES_DAYS: number;
  RETENTION_RESET_REQUESTS_DAYS: number;
  RETENTION_CONTACT_MESSAGES_DAYS: number;
  RETENTION_AUDIT_LOG_MONTHS: number;
}): RetentionPolicy {
  return {
    accessCodesDays: env.RETENTION_ACCESS_CODES_DAYS,
    resetRequestsDays: env.RETENTION_RESET_REQUESTS_DAYS,
    contactMessagesDays: env.RETENTION_CONTACT_MESSAGES_DAYS,
    auditLogMonths: env.RETENTION_AUDIT_LOG_MONTHS,
  };
}
