/**
 * Basis data uji: PGlite in-memory + migrasi asli dari `drizzle/`.
 * Menguji SQL sungguhan (upsert, trigger, constraint), bukan tiruan.
 */
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import type { Database } from '@/db';
import * as schema from '@/db/schema';

export interface TestDb {
  db: Database;
  client: PGlite;
  close: () => Promise<void>;
}

let template: Promise<PGlite> | undefined;

/** Migrasi sekali per worker, lalu tiap tes mendapat salinan (clone) yang terisolasi. */
async function migratedTemplate(): Promise<PGlite> {
  template ??= (async () => {
    const client = new PGlite();
    await migrate(drizzle(client, { schema }), { migrationsFolder: path.join(process.cwd(), 'drizzle') });
    return client;
  })();
  return template;
}

export async function createTestDb(): Promise<TestDb> {
  // clone() bertipe PGliteInterface; implementasinya tetap PGlite.
  const client = (await (await migratedTemplate()).clone()) as PGlite;
  const db = drizzle(client, { schema });
  return { db: db as unknown as Database, client, close: () => client.close() };
}

/** Jadikan `getDb()` mengembalikan basis data uji ini (singleton global di src/db/index.ts). */
export function useAsAppDb(db: Database): void {
  (globalThis as unknown as { __rumahPramukaDb?: { db?: Promise<Database> } }).__rumahPramukaDb = { db: Promise.resolve(db) };
}
