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
import { serverEnv } from '@/lib/env';

export type Database = NodePgDatabase<typeof schema>;

const MIGRATIONS_DIR = path.join(process.cwd(), 'drizzle');

type Holder = { db?: Promise<Database> };
const globalHolder = globalThis as unknown as { __rumahPramukaDb?: Holder };
const holder: Holder = (globalHolder.__rumahPramukaDb ??= {});

async function connect(): Promise<Database> {
  // serverEnv() menolak produksi tanpa DATABASE_URL (kecuali ALLOW_PGLITE=1).
  const env = serverEnv();

  if (env.DATABASE_URL) {
    const { Pool } = await import('pg');
    const { drizzle } = await import('drizzle-orm/node-postgres');
    const pool = new Pool({ connectionString: env.DATABASE_URL, max: env.DATABASE_POOL_MAX });
    return drizzle(pool, { schema });
  }

  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const { migrate } = await import('drizzle-orm/pglite/migrator');
  const dir = env.PGLITE_DIR ?? path.join(process.cwd(), '.data', 'pglite');
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
