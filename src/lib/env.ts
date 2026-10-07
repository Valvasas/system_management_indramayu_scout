/**
 * Satu-satunya tempat yang membaca `process.env` (P1-2).
 *
 * - `publicEnv`  → aman diimpor komponen klien. Next hanya meng-inline referensi
 *   LITERAL `process.env.NEXT_PUBLIC_*`, jadi tiap variabel publik ditulis apa adanya.
 * - `serverEnv()` → variabel server, divalidasi Zod sekali lalu di-cache.
 *   Dipanggil saat server start lewat `src/instrumentation.ts`, sehingga konfigurasi
 *   produksi yang cacat langsung gagal (fail-fast), bukan saat permintaan pertama.
 *
 * Pesan galat hanya menyebut NAMA variabel + aturan yang dilanggar, tidak pernah nilainya
 * (pesan bawaan Zod untuk enum/literal menyertakan nilai yang diterima, jadi tidak dipakai).
 * Daftar variabel & penjelasannya: `.env.example`.
 */
import { z } from 'zod';

type Source = Record<string, string | undefined>;

/** String kosong ("" dari salinan `.env.example`) diperlakukan sebagai tidak diisi. */
const blankToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
const optionalString = z.preprocess(blankToUndefined, z.string().optional());
const flag = z.preprocess(blankToUndefined, z.enum(['0', '1']).optional()).transform((v) => v === '1');
const protocolOf = (v: string) => {
  try {
    return new URL(v).protocol;
  } catch {
    return null;
  }
};
const optionalUrl = (protocols: readonly string[]) =>
  z.preprocess(
    blankToUndefined,
    z
      .string()
      .refine((v) => protocols.includes(protocolOf(v) ?? ''))
      .optional(),
  );
const intInRange = (min: number, max: number, fallback: number) =>
  z.preprocess(blankToUndefined, z.coerce.number().int().min(min).max(max).default(fallback));

/** Penjelasan aturan per variabel. Dipakai untuk pesan galat (tanpa nilai). */
const RULES: Record<string, string> = {
  NODE_ENV: 'harus development, production, atau test',
  NEXT_PUBLIC_SITE_URL: 'harus URL http(s) lengkap, mis. https://pramukaindramayu.or.id',
  DATABASE_URL: 'harus URL postgres:// atau postgresql://',
  DATABASE_POOL_MAX: 'harus bilangan bulat 1–100',
  ALLOW_PGLITE: 'harus 0 atau 1',
  PGLITE_DIR: 'harus berupa path direktori',
  STORAGE_DIR: 'harus berupa path direktori',
  INSECURE_COOKIES: 'harus 0 atau 1',
  CONTACT_WEBHOOK_URL: 'harus URL https:// (atau http:// di luar produksi)',
  DATA_ENCRYPTION_KEYS: 'harus daftar "id:kunci" dipisah koma; id huruf kecil/angka (≤16), kunci base64 32 byte',
  DATA_ENCRYPTION_KEY_ID: 'harus id yang ada di DATA_ENCRYPTION_KEYS',
  BLIND_INDEX_KEY: 'harus base64 32 byte (openssl rand -base64 32)',
  MFA_GRACE_DAYS: 'harus bilangan bulat 0–90',
  RETENTION_CONTACT_MESSAGES_DAYS: 'harus bilangan bulat 30–3650',
  RETENTION_AUDIT_LOG_MONTHS: 'harus bilangan bulat 6–120',
  RETENTION_ACCESS_CODES_DAYS: 'harus bilangan bulat 1–365',
  RETENTION_RESET_REQUESTS_DAYS: 'harus bilangan bulat 7–365',
  SENTRY_DSN: 'harus URL https:// dari Sentry',
  SENTRY_ENVIRONMENT: 'harus teks pendek, mis. production',
  BACKUP_DIR: 'harus berupa path direktori',
  BACKUP_KEEP: 'harus bilangan bulat 1–365',
};

/** Kunci 32 byte dalam base64. `null` = format salah (nilai tidak pernah ikut pesan). */
function decodeKey(b64: string): Buffer | null {
  if (!/^[A-Za-z0-9+/_-]+={0,2}$/.test(b64)) return null;
  const buf = Buffer.from(b64, 'base64');
  return buf.length === 32 ? buf : null;
}

/** "k1:BASE64,k2:BASE64" → Map. Duplikat id atau kunci cacat → gagal. */
const keyList = z.preprocess(
  blankToUndefined,
  z
    .string()
    .transform((raw, ctx) => {
      const keys = new Map<string, Buffer>();
      for (const part of raw
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)) {
        const sep = part.indexOf(':');
        const id = part.slice(0, sep);
        const key = sep > 0 ? decodeKey(part.slice(sep + 1)) : null;
        if (!/^[a-z0-9]{1,16}$/.test(id) || !key || keys.has(id)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: RULES.DATA_ENCRYPTION_KEYS });
          return z.NEVER;
        }
        keys.set(id, key);
      }
      if (keys.size === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: RULES.DATA_ENCRYPTION_KEYS });
        return z.NEVER;
      }
      return keys;
    })
    .optional(),
);
const singleKey = z.preprocess(
  blankToUndefined,
  z
    .string()
    .transform((raw, ctx) => {
      const key = decodeKey(raw.trim());
      if (!key) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: RULES.BLIND_INDEX_KEY });
        return z.NEVER;
      }
      return key;
    })
    .optional(),
);

const serverSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: optionalUrl(['postgres:', 'postgresql:']),
    DATABASE_POOL_MAX: intInRange(1, 100, 10),
    ALLOW_PGLITE: flag,
    PGLITE_DIR: optionalString,
    STORAGE_DIR: optionalString,
    INSECURE_COOKIES: flag,
    CONTACT_WEBHOOK_URL: optionalUrl(['https:', 'http:']),
    /* Enkripsi kolom sensitif (AES-256-GCM) + blind index (HMAC-SHA256). Lihat src/lib/security/crypto.ts. */
    DATA_ENCRYPTION_KEYS: keyList,
    DATA_ENCRYPTION_KEY_ID: z.preprocess(blankToUndefined, z.string().optional()),
    BLIND_INDEX_KEY: singleKey,
    /* MFA pengurus: hari tenggang sebelum pendaftaran TOTP wajib. */
    MFA_GRACE_DAYS: intInRange(0, 90, 7),
    /* Retensi (npm run db:retention). */
    RETENTION_CONTACT_MESSAGES_DAYS: intInRange(30, 3650, 365),
    RETENTION_AUDIT_LOG_MONTHS: intInRange(6, 120, 24),
    RETENTION_ACCESS_CODES_DAYS: intInRange(1, 365, 30),
    RETENTION_RESET_REQUESTS_DAYS: intInRange(7, 365, 90),
    /* Pemantauan galat opsional (hanya server, data pribadi disamarkan). */
    SENTRY_DSN: optionalUrl(['https:']),
    SENTRY_ENVIRONMENT: z.preprocess(blankToUndefined, z.string().max(40).optional()),
    /* Backup (npm run db:backup / tombol Super Admin). */
    BACKUP_DIR: optionalString,
    BACKUP_KEEP: intInRange(1, 365, 14),
  })
  .superRefine((e, ctx) => {
    const prod = e.NODE_ENV === 'production';
    if (prod && !e.DATABASE_URL && !e.ALLOW_PGLITE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['DATABASE_URL'],
        message: 'wajib diisi di produksi (ALLOW_PGLITE=1 hanya untuk uji lokal/CI dengan data demo)',
      });
    }
    if (prod && e.CONTACT_WEBHOOK_URL?.startsWith('http:')) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['CONTACT_WEBHOOK_URL'], message: 'wajib https:// di produksi' });
    }
    // Kunci pengembangan bawaan hanya untuk data demo; produksi sungguhan wajib kunci sendiri.
    if (prod && !e.ALLOW_PGLITE) {
      if (!e.DATA_ENCRYPTION_KEYS)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['DATA_ENCRYPTION_KEYS'], message: 'wajib diisi di produksi' });
      if (!e.BLIND_INDEX_KEY) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['BLIND_INDEX_KEY'], message: 'wajib diisi di produksi' });
    }
    if (e.DATA_ENCRYPTION_KEYS) {
      const active = e.DATA_ENCRYPTION_KEY_ID ?? (e.DATA_ENCRYPTION_KEYS.size === 1 ? [...e.DATA_ENCRYPTION_KEYS.keys()][0] : undefined);
      if (!active || !e.DATA_ENCRYPTION_KEYS.has(active))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['DATA_ENCRYPTION_KEY_ID'],
          message: 'wajib menunjuk salah satu id di DATA_ENCRYPTION_KEYS (boleh kosong bila hanya satu kunci)',
        });
    }
  });

type ParsedServer = z.infer<typeof serverSchema>;

export interface ServerEnv extends ParsedServer {
  isProduction: boolean;
  /** PGlite dipakai bila DATABASE_URL kosong; di produksi hanya dengan ALLOW_PGLITE=1. */
  usePglite: boolean;
  /** Cookie `__Host-`/Secure. Mati hanya di luar produksi atau dengan INSECURE_COOKIES=1. */
  secureCookies: boolean;
}

export class EnvError extends Error {
  readonly issues: { variable: string; rule: string }[];
  constructor(issues: { variable: string; rule: string }[]) {
    super(`Konfigurasi environment tidak valid (lihat .env.example):\n${issues.map((i) => `  - ${i.variable}: ${i.rule}`).join('\n')}`);
    this.name = 'EnvError';
    this.issues = issues;
  }
}

function toEnvError(error: z.ZodError): EnvError {
  const seen = new Set<string>();
  const issues: { variable: string; rule: string }[] = [];
  for (const issue of error.issues) {
    const variable = String(issue.path[0] ?? 'env');
    if (seen.has(variable)) continue;
    seen.add(variable);
    // Pesan custom ditulis sendiri (tanpa nilai). Selain itu pakai RULES, bukan pesan Zod.
    const rule = issue.code === z.ZodIssueCode.custom ? issue.message : (RULES[variable] ?? 'tidak valid');
    issues.push({ variable, rule });
  }
  return new EnvError(issues);
}

/** Validasi murni (tanpa cache) — diekspor untuk tes. */
export function parseServerEnv(source: Source): ServerEnv {
  const result = serverSchema.safeParse(source);
  if (!result.success) throw toEnvError(result.error);
  const e = result.data;
  const isProduction = e.NODE_ENV === 'production';
  return {
    ...e,
    isProduction,
    usePglite: !e.DATABASE_URL,
    secureCookies: isProduction && !e.INSECURE_COOKIES,
  };
}

let cached: ServerEnv | undefined;

/** Variabel server tervalidasi. Melempar `EnvError` bila konfigurasi cacat. */
export function serverEnv(): ServerEnv {
  if (typeof window !== 'undefined') throw new Error('serverEnv() hanya boleh dipanggil di server.');
  return (cached ??= parseServerEnv(process.env));
}

/** Build pengembangan (`next dev`)? Di-inline saat build; aman di edge & klien. */
export const isDevBuild = process.env.NODE_ENV !== 'production';

const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: optionalUrl(['https:', 'http:']),
});

export function parsePublicEnv(source: Source) {
  const result = publicSchema.safeParse(source);
  if (!result.success) throw toEnvError(result.error);
  return {
    siteUrl: (result.data.NEXT_PUBLIC_SITE_URL ?? 'https://pramukaindramayu.or.id').replace(/\/$/, ''),
  };
}

/** Aman di klien. Override domain lewat NEXT_PUBLIC_SITE_URL saat pratinjau/staging. */
export const publicEnv = parsePublicEnv({ NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL });

/**
 * Env untuk proses anak (pg_dump/pg_restore): PATH & locale ikut, ditambah `extra`.
 * Rahasia (mis. PGPASSWORD) lewat env, bukan argumen — argumen terlihat di daftar proses.
 */
export function childProcessEnv(extra: Record<string, string> = {}): Record<string, string> {
  const base: Record<string, string> = {};
  for (const key of ['PATH', 'LANG', 'TZ'] as const) {
    const v = process.env[key];
    if (v) base[key] = v;
  }
  return { ...base, ...extra };
}
