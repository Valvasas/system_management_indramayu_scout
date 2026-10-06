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
};

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

/** Runtime Next yang sedang berjalan (`nodejs` | `edge`), di-inline saat build. */
export const nextRuntime = process.env.NEXT_RUNTIME;

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
