/**
 * SERVER-ONLY. Rate limit bersama berbasis tabel PostgreSQL `rate_limits` (tanpa Redis).
 * Semua instance aplikasi berbagi hitungan karena membaca baris yang sama; kenaikan hitungan
 * memakai satu `INSERT … ON CONFLICT DO UPDATE` sehingga atomik walau diakses bersamaan.
 *
 * Antarmuka lama dipertahankan (`createRateLimiter(max, windowMs).limited(key)` / `.reset(key)`),
 * kini async dan wajib `scope` agar kunci antar-pembatas tidak bertabrakan.
 *
 * Jendela tetap: setiap percobaan dihitung (termasuk yang ditolak) sampai jendela berakhir.
 * Bila basis data gagal: `failClosed: true` → ditolak (login, kode akses, MFA);
 * `failClosed: false` → diizinkan (formulir publik yang toh akan gagal menyimpan).
 */
import { lt, sql } from 'drizzle-orm';
import { getDb, schema, type Database } from '@/db';
import { blindIndex } from './crypto';

export interface RateLimitHit {
  count: number;
  resetAt: Date;
}

export interface RateLimitStore {
  /** Tambah satu hitungan untuk `key` di jendela berjalan; kembalikan hitungan setelahnya. */
  hit(key: string, windowMs: number, now: Date): Promise<RateLimitHit>;
  reset(key: string): Promise<void>;
  /** Hapus baris yang jendelanya sudah lewat. Mengembalikan jumlah baris terhapus. */
  purgeExpired(now: Date): Promise<number>;
}

const ts = (d: Date) => sql`${d.toISOString()}::timestamptz`;

export function dbRateLimitStore(database: () => Promise<Database> = getDb): RateLimitStore {
  const t = schema.rateLimits;
  return {
    async hit(key, windowMs, now) {
      const db = await database();
      const end = new Date(now.getTime() + windowMs);
      // Semua ekspresi SET membaca nilai LAMA baris, jadi kedua CASE melihat jendela yang sama.
      const [row] = await db
        .insert(t)
        .values({ key, count: 1, windowEndsAt: end })
        .onConflictDoUpdate({
          target: t.key,
          set: {
            count: sql`CASE WHEN ${t.windowEndsAt} <= ${ts(now)} THEN 1 ELSE ${t.count} + 1 END`,
            windowEndsAt: sql`CASE WHEN ${t.windowEndsAt} <= ${ts(now)} THEN ${ts(end)} ELSE ${t.windowEndsAt} END`,
          },
        })
        .returning({ count: t.count, resetAt: t.windowEndsAt });
      return row;
    },
    async reset(key) {
      const db = await database();
      await db.delete(t).where(sql`${t.key} = ${key}`);
    },
    async purgeExpired(now) {
      const db = await database();
      const deleted = await db.delete(t).where(lt(t.windowEndsAt, now)).returning({ key: t.key });
      return deleted.length;
    },
  };
}

export interface RateLimiterOptions {
  /** Nama unik pembatas, mis. `login-ip`. Memisahkan hitungan antar-pembatas. */
  scope: string;
  /** Tolak permintaan bila penyimpanan gagal. Wajib true untuk autentikasi. */
  failClosed: boolean;
  store?: RateLimitStore;
  now?: () => Date;
}

/** Peluang pembersihan oportunistik per pemanggilan (tabel tetap kecil tanpa cron). */
const PURGE_PROBABILITY = 0.02;

export function createRateLimiter(max: number, windowMs: number, options: RateLimiterOptions) {
  const store = options.store ?? dbRateLimitStore();
  const now = options.now ?? (() => new Date());
  // IP & nama pengguna tidak disimpan mentah: HMAC dengan kunci server (UU PDP: minimisasi).
  const keyOf = (key: string) => blindIndex(`${options.scope}:${key}`, 'rate-limit');

  return {
    /** true = permintaan ditolak. */
    async limited(key: string): Promise<boolean> {
      try {
        const { count } = await store.hit(keyOf(key), windowMs, now());
        if (Math.random() < PURGE_PROBABILITY) store.purgeExpired(now()).catch(() => undefined);
        return count > max;
      } catch (err) {
        console.error(`[rate-limit] penyimpanan gagal (${options.scope}); ${options.failClosed ? 'ditolak' : 'diizinkan'}`, err);
        return options.failClosed;
      }
    },
    async reset(key: string): Promise<void> {
      try {
        await store.reset(keyOf(key));
      } catch (err) {
        console.error(`[rate-limit] gagal mereset (${options.scope})`, err);
      }
    },
  };
}
