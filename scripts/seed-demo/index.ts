/**
 * Seed demo per fitur (Blok 2+). Setiap berkas `NN-nama.ts` di folder ini mengekspor
 * `seed(ctx)` dan dijalankan urut nama berkas setelah data demo inti dibuat oleh seed.ts.
 * Semua data FIKTIF. Menambah fitur = menambah berkas, tanpa menyentuh seed.ts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Database } from '../../src/db';
import type { EventRow, GudepRow, KwarranRow, MemberRow, UserRow } from '../../src/db/schema';

export interface SeedContext {
  db: Database;
  /** Akun demo berdasarkan nama pengguna (admin, kwarcab, humas, kwarran.indramayu, gudep.smp1, peserta.dimas). */
  users: Record<string, UserRow>;
  kwarran: KwarranRow[];
  gudep: GudepRow[];
  members: MemberRow[];
  events: EventRow[];
  /** Tanggal relatif hari ini (jam lokal), sama dengan seed.ts. */
  daysFromNow: (days: number, hour?: number) => Date;
}

export async function seedFeatures(ctx: SeedContext): Promise<void> {
  const dir = path.dirname(new URL(import.meta.url).pathname);
  const files = fs
    .readdirSync(dir)
    .filter((f) => /^\d{2}-[a-z0-9-]+\.ts$/.test(f))
    .sort();
  for (const f of files) {
    const mod = (await import(pathToFileURL(path.join(dir, f)).href)) as { seed?: (c: SeedContext) => Promise<void> };
    if (typeof mod.seed !== 'function') throw new Error(`${f} tidak mengekspor seed(ctx)`);
    await mod.seed(ctx);
    console.log(`  + demo ${f.replace(/\.ts$/, '')}`);
  }
}
