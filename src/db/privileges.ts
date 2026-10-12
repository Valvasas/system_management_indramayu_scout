/**
 * SERVER-ONLY. Hak akses user aplikasi yang WAJIB berlaku, diterapkan ulang di setiap
 * `npm run db:migrate` (idempoten).
 *
 * Migrasi 0004 (log audit INSERT-only) dan 0010 (jurnal migrasi terbaca) hanya berjalan sekali.
 * Setelah restore backup (`pg_restore --clean`, atau ke volume baru) tabel dibuat ulang dengan
 * hak bawaan — user aplikasi mendapat DELETE lagi pada log audit, dan jurnal tercatat "sudah
 * dimigrasi" sehingga 0004/0010 tidak diulang. Langkah ini menutup celah itu.
 * Peran lain → atur manual (docs/security/audit-log-policy.md).
 */
import { sql } from 'drizzle-orm';
import type { Database } from '@/db';

export const APP_ROLE = 'rumah_pramuka_app';

export async function applyAppRolePrivileges(db: Database, role = APP_ROLE): Promise<boolean> {
  if (!/^[a-z_][a-z0-9_]{0,62}$/.test(role)) throw new Error('Nama peran tidak valid.');
  const exists = (await db.execute(sql`SELECT 1 FROM pg_roles WHERE rolname = ${role}`)) as unknown as { rows: unknown[] };
  if (exists.rows.length === 0) return false;
  const r = sql.raw(`"${role}"`);
  await db.execute(sql`REVOKE UPDATE, DELETE, TRUNCATE ON "audit_logs" FROM ${r}`);
  await db.execute(sql`REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON "audit_chain_anchors" FROM ${r}`);
  const drizzleSchema = (await db.execute(sql`SELECT 1 FROM pg_namespace WHERE nspname = 'drizzle'`)) as unknown as { rows: unknown[] };
  if (drizzleSchema.rows.length > 0) {
    await db.execute(sql`GRANT USAGE ON SCHEMA drizzle TO ${r}`);
    await db.execute(sql`GRANT SELECT ON ALL TABLES IN SCHEMA drizzle TO ${r}`);
    await db.execute(sql`GRANT SELECT ON ALL SEQUENCES IN SCHEMA drizzle TO ${r}`);
  }
  return true;
}
