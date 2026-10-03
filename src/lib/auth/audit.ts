import { getDb, schema } from '@/db';
import { clientIp } from '@/lib/security/request';
import type { SessionUser } from './session';

export interface AuditEntry {
  action: string;
  summary: string;
  entityType?: string;
  entityId?: string;
}

/**
 * Catat aksi ke log audit (docs/security/audit-log-policy.md).
 * Wajib untuk: login, perubahan data anggota, akses ekspor, perubahan peran/akun,
 * publikasi konten, pengaturan. Kegagalan mencatat tidak boleh membatalkan aksi utama.
 */
export async function audit(actor: Pick<SessionUser, 'id' | 'name'> | null, entry: AuditEntry): Promise<void> {
  try {
    const db = await getDb();
    await db.insert(schema.auditLogs).values({
      userId: actor?.id ?? null,
      actorName: actor?.name ?? 'Sistem',
      action: entry.action,
      summary: entry.summary.slice(0, 500),
      entityType: entry.entityType,
      entityId: entry.entityId,
      ip: safeIp(),
    });
  } catch (err) {
    console.error('[audit] gagal mencatat', entry.action, err);
  }
}

function safeIp(): string | null {
  try {
    return clientIp();
  } catch {
    return null; // dipanggil di luar konteks request (mis. skrip seed)
  }
}
