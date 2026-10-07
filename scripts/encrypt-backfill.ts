/**
 * Enkripsi data lama & rotasi kunci kolom sensitif.
 *   npm run db:encrypt-backfill               → enkripsi/rotasi
 *   npm run db:encrypt-backfill -- --dry-run  → hitung saja
 *
 * Rotasi kunci: tambahkan kunci baru ke DATA_ENCRYPTION_KEYS (kunci lama TETAP ada),
 * set DATA_ENCRYPTION_KEY_ID ke id baru, deploy, jalankan skrip ini, lalu setelah
 * hasilnya 0 baris diperbarui, kunci lama boleh dihapus dari env.
 */
import { getDb } from '../src/db';
import { backfillEncryptedColumns } from '../src/db/encrypt-backfill';
import { envKeyring } from '../src/lib/security/crypto';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const ring = envKeyring();
  if (ring.dev) console.warn('PERINGATAN: memakai kunci pengembangan publik (DATA_ENCRYPTION_KEYS kosong). Hanya untuk data demo.');
  const db = await getDb();
  const reports = await backfillEncryptedColumns(db, ring, { dryRun });
  for (const r of reports) {
    console.log(`${r.table}.${r.column}: ${r.scanned} baris diperiksa, ${r.updated} ${dryRun ? 'perlu' : 'telah'} dienkripsi (ulang)`);
  }
  console.log(`Kunci aktif: ${ring.activeId}${dryRun ? ' (dry run, tidak ada yang diubah)' : ''}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
