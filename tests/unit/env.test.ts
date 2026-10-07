import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { EnvError, parsePublicEnv, parseServerEnv } from '@/lib/env';

/** Kunci enkripsi wajib di produksi (1.3); disediakan agar tes fokus pada variabel lain. */
const KEYS = {
  DATA_ENCRYPTION_KEYS: `k1:${randomBytes(32).toString('base64')}`,
  BLIND_INDEX_KEY: randomBytes(32).toString('base64'),
};

const SECRET_URL = 'postgresql://app:sangat-rahasia-123@db.internal:5432/rumah';

function errorOf(fn: () => unknown): EnvError {
  try {
    fn();
  } catch (e) {
    if (e instanceof EnvError) return e;
    throw e;
  }
  throw new Error('diharapkan melempar EnvError');
}

describe('validasi environment (P1-2)', () => {
  it('pengembangan tanpa DATABASE_URL memakai PGlite', () => {
    const env = parseServerEnv({ NODE_ENV: 'development' });
    expect(env.usePglite).toBe(true);
    expect(env.DATABASE_POOL_MAX).toBe(10);
    expect(env.secureCookies).toBe(false);
  });

  it('produksi tanpa DATABASE_URL gagal cepat dengan pesan jelas', () => {
    const err = errorOf(() => parseServerEnv({ NODE_ENV: 'production', ...KEYS }));
    expect(err.issues.map((i) => i.variable)).toEqual(['DATABASE_URL']);
    expect(err.message).toMatch(/DATABASE_URL: wajib diisi di produksi/);
  });

  it('produksi boleh PGlite hanya dengan ALLOW_PGLITE=1', () => {
    const env = parseServerEnv({ NODE_ENV: 'production', ALLOW_PGLITE: '1' });
    expect(env.usePglite).toBe(true);
    expect(env.secureCookies).toBe(true);
  });

  it('string kosong dari salinan .env.example dianggap tidak diisi', () => {
    const err = errorOf(() => parseServerEnv({ NODE_ENV: 'production', DATABASE_URL: '  ', ...KEYS }));
    expect(err.issues[0].variable).toBe('DATABASE_URL');
  });

  it('nilai tidak valid tidak pernah ikut tercetak di pesan galat', () => {
    const err = errorOf(() =>
      parseServerEnv({
        NODE_ENV: 'production',
        DATABASE_URL: SECRET_URL.replace('postgresql', 'mysql'),
        DATABASE_POOL_MAX: '9999-rahasia',
        ALLOW_PGLITE: 'ya-rahasia',
        CONTACT_WEBHOOK_URL: 'ftp://hooks.example/token-rahasia',
      }),
    );
    expect(err.issues.map((i) => i.variable).sort()).toEqual(
      ['ALLOW_PGLITE', 'CONTACT_WEBHOOK_URL', 'DATABASE_POOL_MAX', 'DATABASE_URL'].sort(),
    );
    const text = `${err.message} ${JSON.stringify(err.issues)}`;
    expect(text).not.toMatch(/rahasia|sangat|db\.internal|hooks\.example/);
  });

  it('webhook http:// ditolak di produksi tetapi boleh saat pengembangan', () => {
    expect(() =>
      parseServerEnv({ NODE_ENV: 'production', DATABASE_URL: SECRET_URL, CONTACT_WEBHOOK_URL: 'http://localhost:9000/x', ...KEYS }),
    ).toThrow(/CONTACT_WEBHOOK_URL: wajib https/);
    expect(parseServerEnv({ NODE_ENV: 'development', CONTACT_WEBHOOK_URL: 'http://localhost:9000/x' }).CONTACT_WEBHOOK_URL).toBe(
      'http://localhost:9000/x',
    );
  });

  it('INSECURE_COOKIES=1 mematikan cookie Secure di produksi (uji lokal via HTTP)', () => {
    const env = parseServerEnv({ NODE_ENV: 'production', DATABASE_URL: SECRET_URL, INSECURE_COOKIES: '1', ...KEYS });
    expect(env.secureCookies).toBe(false);
    expect(env.usePglite).toBe(false);
  });

  it('URL situs publik: default domain resmi, garis miring akhir dibuang, protokol asing ditolak', () => {
    expect(parsePublicEnv({}).siteUrl).toBe('https://pramukaindramayu.or.id');
    expect(parsePublicEnv({ NEXT_PUBLIC_SITE_URL: 'https://staging.example.org/' }).siteUrl).toBe('https://staging.example.org');
    expect(() => parsePublicEnv({ NEXT_PUBLIC_SITE_URL: 'javascript:alert(1)' })).toThrow(EnvError);
  });
});
