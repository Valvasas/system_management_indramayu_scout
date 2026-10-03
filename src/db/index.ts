/**
 * Koneksi database.
 *
 * - `DATABASE_URL` terisi  → PostgreSQL (produksi/staging) lewat `pg`.
 *   Migrasi dijalankan eksplisit: `npm run db:migrate`.
 * - `DATABASE_URL` kosong  → PGlite (PostgreSQL di dalam proses) di `PGLITE_DIR`,
 *   khusus pengembangan lokal. Migrasi otomatis saat koneksi pertama.
 *   Ditolak di produksi kecuali `ALLOW_PGLITE=1` (mis. uji `next start` lokal).
 *
 * Koneksi dibuat malas (saat query pertama) supaya `next build` tidak menyentuh database.
 */
import path from 'node:path';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export type Database = NodePgDatabase<typeof schema>;

const MIGRATIONS_DIR = path.join(process.cwd(), 'drizzle');

type Holder = { db?: Promise<Database> };
const globalHolder = globalThis as unknown as { __rumahPramukaDb?: Holder };
const holder: Holder = (globalHolder.__rumahPramukaDb ??= {});

async function connect(): Promise<Database> {
  const url = process.env.DATABASE_URL;

  if (url) {
    const { Pool } = await import('pg');
    const { drizzle } = await import('drizzle-orm/node-postgres');
    const pool = new Pool({ connectionString: url, max: Number(process.env.DATABASE_POOL_MAX ?? 10) });
    return drizzle(pool, { schema });
  }

  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PGLITE !== '1') {
    throw new Error('DATABASE_URL wajib diisi di produksi (lihat .env.example).');
  }

  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const { migrate } = await import('drizzle-orm/pglite/migrator');
  const dir = process.env.PGLITE_DIR ?? path.join(process.cwd(), '.data', 'pglite');
  const { mkdirSync } = await import('node:fs');
  mkdirSync(dir, { recursive: true });
  const client = new PGlite(dir);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  // Kedua driver berbagi dialek & API query PostgreSQL yang sama.
  return db as unknown as Database;
}

/** Ambil instance database (singleton per proses, aman terhadap hot reload). */
export function getDb(): Promise<Database> {
  holder.db ??= connect().catch((err) => {
    holder.db = undefined;
    throw err;
  });
  return holder.db;
}

export { schema, MIGRATIONS_DIR };
