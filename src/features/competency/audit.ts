/**
 * SERVER-ONLY. Pencatatan log audit SKU/SKK (2.3) di dalam modul inti (bukan di Server Action),
 * supaya tercatat di jalur mana pun dan bisa diuji. Ringkasan sengaja TANPA nama anggota dan tanpa
 * catatan pembina: log tidak bisa diubah, sedangkan identitas anggota bisa dianonimkan kemudian.
 */
import type { Database } from '@/db';
import { appendAuditEntry, truncateStorable } from '@/lib/auth/audit-chain';
import type { SessionUser } from '@/lib/auth/session';

export interface CompetencyOptions {
  db?: Database;
  now?: Date;
  /** IP pelaku untuk log audit (diisi pembungkus Server Action / route handler). */
  ip?: string | null;
}

export async function writeCompetencyAudit(
  d: Database,
  actor: SessionUser,
  ip: string | null | undefined,
  entry: { action: string; summary: string; entityType: string; entityId?: string | null },
): Promise<void> {
  try {
    await appendAuditEntry(d, {
      userId: actor.id,
      actorName: actor.name,
      ip: ip ?? null,
      action: entry.action,
      summary: truncateStorable(entry.summary, 500),
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
    });
  } catch (err) {
    // Sama dengan audit(): kegagalan mencatat tidak membatalkan aksi utama.
    console.error('[audit] gagal mencatat', entry.action, err);
  }
}
