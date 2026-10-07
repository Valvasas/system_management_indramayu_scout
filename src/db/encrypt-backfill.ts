/**
 * Backfill & rotasi enkripsi kolom sensitif. Idempoten: aman dijalankan berulang.
 * - Teks lama (belum terenkripsi) → dienkripsi dengan kunci aktif.
 * - Terenkripsi dengan kunci non-aktif (setelah rotasi) → didekripsi lalu dienkripsi ulang.
 * - Sudah memakai kunci aktif → dilewati.
 * Pembaruan bersyarat (`WHERE kolom = nilai_lama`) supaya penulisan aplikasi yang terjadi
 * bersamaan tidak tertimpa. Dipanggil oleh `npm run db:encrypt-backfill`.
 */
import { sql } from 'drizzle-orm';
import type { Database } from './index';
import { ENCRYPTED_COLUMNS } from './encrypted-text';
import { createFieldCipher, type Keyring } from '../lib/security/crypto';

export interface BackfillReport {
  table: string;
  column: string;
  scanned: number;
  updated: number;
}

const BATCH = 500;

type Row = { id: string; v: string };
const rowsOf = (result: unknown): Row[] => ((result as { rows?: Row[] }).rows ?? []) as Row[];

export async function backfillEncryptedColumns(db: Database, ring: Keyring, opts: { dryRun?: boolean } = {}): Promise<BackfillReport[]> {
  const cipher = createFieldCipher(ring);
  const reports: BackfillReport[] = [];
  for (const { table, column, aad } of ENCRYPTED_COLUMNS) {
    const report: BackfillReport = { table, column, scanned: 0, updated: 0 };
    let lastId = '00000000-0000-0000-0000-000000000000';
    for (;;) {
      const batch = rowsOf(
        await db.execute(
          sql`SELECT id::text AS id, ${sql.identifier(column)} AS v FROM ${sql.identifier(table)}
              WHERE ${sql.identifier(column)} IS NOT NULL AND id > ${lastId}::uuid ORDER BY id LIMIT ${BATCH}`,
        ),
      );
      if (batch.length === 0) break;
      for (const row of batch) {
        report.scanned++;
        if (!cipher.needsReencryption(row.v)) continue;
        const next = cipher.encrypt(cipher.decrypt(row.v, aad), aad);
        if (!opts.dryRun) {
          await db.execute(
            sql`UPDATE ${sql.identifier(table)} SET ${sql.identifier(column)} = ${next}
                WHERE id = ${row.id}::uuid AND ${sql.identifier(column)} = ${row.v}`,
          );
        }
        report.updated++;
      }
      lastId = batch[batch.length - 1].id;
    }
    reports.push(report);
  }
  return reports;
}
