import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createRateLimiter, dbRateLimitStore, type RateLimitStore } from '@/lib/security/rate-limit';
import { schema } from '@/db';
import { createTestDb, type TestDb } from '../helpers/test-db';

let t: TestDb;
beforeAll(async () => {
  t = await createTestDb();
});
afterAll(async () => {
  await t.close();
});

const clock = (start = Date.parse('2026-10-06T08:00:00Z')) => {
  let now = start;
  return { now: () => new Date(now), advance: (ms: number) => (now += ms) };
};

describe('rate limit bersama berbasis PostgreSQL (1.1)', () => {
  it('menolak setelah batas, per kunci, lalu pulih setelah jendela', async () => {
    const c = clock();
    const rl = createRateLimiter(3, 10 * 60_000, {
      scope: 'uji-a',
      failClosed: true,
      store: dbRateLimitStore(async () => t.db),
      now: c.now,
    });
    const first = [];
    for (let i = 0; i < 3; i++) first.push(await rl.limited('10.0.0.1'));
    expect(first).toEqual([false, false, false]);
    expect(await rl.limited('10.0.0.1')).toBe(true);
    expect(await rl.limited('10.0.0.2')).toBe(false); // kunci lain tidak terpengaruh
    c.advance(10 * 60_000 + 1);
    expect(await rl.limited('10.0.0.1')).toBe(false);
  });

  it('dua instance aplikasi berbagi hitungan yang sama', async () => {
    const c = clock();
    const opts = { scope: 'uji-bersama', failClosed: true, now: c.now } as const;
    const instanceA = createRateLimiter(4, 60_000, { ...opts, store: dbRateLimitStore(async () => t.db) });
    const instanceB = createRateLimiter(4, 60_000, { ...opts, store: dbRateLimitStore(async () => t.db) });
    expect(await instanceA.limited('akun')).toBe(false);
    expect(await instanceB.limited('akun')).toBe(false);
    expect(await instanceA.limited('akun')).toBe(false);
    expect(await instanceB.limited('akun')).toBe(false);
    // Percobaan ke-5 ditolak di instance mana pun.
    expect(await instanceA.limited('akun')).toBe(true);
    expect(await instanceB.limited('akun')).toBe(true);
  });

  it('percobaan bersamaan dihitung atomik (tanpa hitungan hilang)', async () => {
    const c = clock();
    const rl = createRateLimiter(1000, 60_000, {
      scope: 'uji-serentak',
      failClosed: true,
      store: dbRateLimitStore(async () => t.db),
      now: c.now,
    });
    await Promise.all(Array.from({ length: 25 }, () => rl.limited('x')));
    const rows = await t.db.select().from(schema.rateLimits);
    expect(rows.some((r) => r.count === 25)).toBe(true);
  });

  it('cakupan berbeda tidak bertabrakan dan IP tidak tersimpan mentah', async () => {
    const c = clock();
    const store = dbRateLimitStore(async () => t.db);
    const login = createRateLimiter(1, 60_000, { scope: 'uji-login', failClosed: true, store, now: c.now });
    const kontak = createRateLimiter(1, 60_000, { scope: 'uji-kontak', failClosed: false, store, now: c.now });
    expect(await login.limited('203.0.113.9')).toBe(false);
    expect(await kontak.limited('203.0.113.9')).toBe(false);
    const rows = await t.db.select().from(schema.rateLimits);
    expect(rows.every((r) => !r.key.includes('203.0.113.9'))).toBe(true);
    expect(rows.every((r) => /^[0-9a-f]{64}$/.test(r.key))).toBe(true);
  });

  it('reset membuka kembali kunci (dipakai setelah login berhasil)', async () => {
    const c = clock();
    const rl = createRateLimiter(1, 60_000, {
      scope: 'uji-reset',
      failClosed: true,
      store: dbRateLimitStore(async () => t.db),
      now: c.now,
    });
    await rl.limited('u');
    expect(await rl.limited('u')).toBe(true);
    await rl.reset('u');
    expect(await rl.limited('u')).toBe(false);
  });

  it('pembersihan menghapus baris yang jendelanya lewat saja', async () => {
    const c = clock(Date.parse('2030-01-01T00:00:00Z'));
    const store = dbRateLimitStore(async () => t.db);
    const rl = createRateLimiter(5, 60_000, { scope: 'uji-purge', failClosed: true, store, now: c.now });
    await rl.limited('lama');
    const before = (await t.db.select().from(schema.rateLimits)).length;
    const removed = await store.purgeExpired(new Date(Date.parse('2030-01-01T00:00:30Z')));
    expect((await t.db.select().from(schema.rateLimits)).length).toBe(before - removed);
    // Baris 'lama' belum kedaluwarsa pada detik ke-30, jadi tetap ada → pembatas masih menghitung.
    expect(await rl.limited('lama')).toBe(false);
  });

  it('DB gagal: fail-closed untuk autentikasi, fail-open untuk formulir publik', async () => {
    const broken: RateLimitStore = {
      hit: () => Promise.reject(new Error('koneksi putus')),
      reset: () => Promise.reject(new Error('koneksi putus')),
      purgeExpired: () => Promise.reject(new Error('koneksi putus')),
    };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const auth = createRateLimiter(10, 60_000, { scope: 'login-ip', failClosed: true, store: broken });
    const publicForm = createRateLimiter(10, 60_000, { scope: 'kontak-ip', failClosed: false, store: broken });
    expect(await auth.limited('x')).toBe(true);
    expect(await publicForm.limited('x')).toBe(false);
    await expect(auth.reset('x')).resolves.toBeUndefined();
    spy.mockRestore();
  });
});
