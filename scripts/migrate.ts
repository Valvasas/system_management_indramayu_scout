/**
 * Jalankan migrasi SQL di folder `drizzle/` terhadap database, lalu enkripsi data sensitif lama.
 *   npm run db:migrate
 * Dengan DATABASE_URL → PostgreSQL (jalankan dengan pemilik skema). Tanpa itu → PGlite lokal (.data/pglite).
 *
 * Backfill enkripsi (src/db/encrypt-backfill.ts) ikut dijalankan setiap kali: idempoten, dan
 * memastikan tidak ada baris lama yang tertinggal sebagai teks biasa setelah deploy.
 * Validasi env (src/lib/env.ts) menolak DATABASE_URL tanpa kunci enkripsi.
 */
import path from 'node:path';
import type { Database } from '../src/db';
import { backfillEncryptedColumns } from '../src/db/encrypt-backfill';
import { serverEnv } from '../src/lib/env';
import { envKeyring } from '../src/lib/security/crypto';

async function main() {
  const migrationsFolder = path.join(process.cwd(), 'drizzle');
  const env = serverEnv();
  const ring = envKeyring();

  let db: Database;
  let close = async () => {};
  if (env.DATABASE_URL) {
    const { Pool } = await import('pg');
    const { drizzle } = await import('drizzle-orm/node-postgres');
    const { migrate } = await import('drizzle-orm/node-postgres/migrator');
    const pool = new Pool({ connectionString: env.DATABASE_URL, max: 1 });
    const pgDb = drizzle(pool);
    await migrate(pgDb, { migrationsFolder });
    db = pgDb as unknown as Database;
    close = () => pool.end();
  } else {
    const { getDb } = await import('../src/db');
    db = await getDb(); // PGlite bermigrasi otomatis saat koneksi pertama
  }
  console.log('Migrasi selesai.');

  const reports = await backfillEncryptedColumns(db, ring);
  const updated = reports.reduce((n, r) => n + r.updated, 0);
  console.log(
    `Enkripsi kolom sensitif: ${updated} baris dienkripsi/dirotasi (kunci aktif: ${ring.activeId}${ring.dev ? ', PENGEMBANGAN' : ''}).`,
  );
  await close();
  process.exit(0);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
