import { getDb } from '@/db';
import { appendAuditEntry, truncateStorable } from './audit-chain';
import { blindIndex } from '@/lib/security/crypto';
import { clientIp } from '@/lib/security/request';
import type { SessionUser } from './session';

export interface AuditEntry {
  action: string;
  summary: string;
  entityType?: string;
  entityId?: string;
}

/** Prefiks penanda bahwa kolom `ip` berisi sidik HMAC, bukan alamat IP. */
export const IP_FINGERPRINT_PREFIX = 'hmac:';

/**
 * Catat aksi ke log audit (docs/security/audit-log-policy.md).
 * Wajib untuk: login, perubahan data anggota, akses ekspor, perubahan peran/akun,
 * publikasi konten, pengaturan. Kegagalan mencatat tidak boleh membatalkan aksi utama.
 *
 * Alamat IP: aksi pengurus (ada pelaku) menyimpan IP apa adanya untuk akuntabilitas. Entri
 * tanpa pelaku (formulir publik: keputusan wali, gagal masuk, permintaan reset) hanya
 * menyimpan sidik HMAC-nya — percobaan dari sumber yang sama tetap bisa dikaitkan, tetapi IP
 * wali/pengunjung tidak tersimpan di log yang tidak bisa diubah ini.
 */
export async function audit(actor: Pick<SessionUser, 'id' | 'name'> | null, entry: AuditEntry): Promise<void> {
  try {
    const db = await getDb();
    const ip = safeIp();
    // Masuk rantai HMAC tahan-ubah (audit-chain.ts); tabel INSERT-only di tingkat DB.
    await appendAuditEntry(db, {
      userId: actor?.id ?? null,
      actorName: actor?.name ?? 'Sistem',
      action: entry.action,
      summary: truncateStorable(entry.summary, 500),
      entityType: entry.entityType ?? null,
      entityId: entry.entityId ?? null,
      ip: actor || !ip ? ip : auditIpFingerprint(ip),
    });
  } catch (err) {
    console.error('[audit] gagal mencatat', entry.action, err);
  }
}

export const auditIpFingerprint = (ip: string) => `${IP_FINGERPRINT_PREFIX}${blindIndex(ip, 'audit-ip').slice(0, 24)}`;

function safeIp(): string | null {
  try {
    return clientIp();
  } catch {
    return null; // dipanggil di luar konteks request (mis. skrip seed)
  }
}
