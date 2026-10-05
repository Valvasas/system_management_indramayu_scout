import { describe, expect, it, vi } from 'vitest';
import { generateTemporaryPassword, hashPassword, passwordProblem, verifyPassword } from '@/lib/auth/password';
import { createRateLimiter } from '@/lib/security/request';

describe('kebijakan kata sandi', () => {
  it('menolak yang pendek, tanpa angka, atau tanpa huruf', () => {
    expect(passwordProblem('abc123')).toMatch(/Minimal/);
    expect(passwordProblem('hanyahuruf-saja')).toMatch(/huruf dan angka/);
    expect(passwordProblem('1234567890')).toMatch(/huruf dan angka/);
    expect(passwordProblem('pramuka-2026-ok')).toBeNull();
  });

  it('hash bukan teks asli dan dapat diverifikasi', async () => {
    const hash = await hashPassword('pramuka-2026-ok');
    expect(hash).not.toContain('pramuka');
    expect(await verifyPassword('pramuka-2026-ok', hash)).toBe(true);
    expect(await verifyPassword('salah', hash)).toBe(false);
  });

  it('sandi sementara memenuhi kebijakan dan tanpa karakter membingungkan', () => {
    for (let i = 0; i < 50; i++) {
      const p = generateTemporaryPassword();
      expect(passwordProblem(p), p).toBeNull();
      expect(p).not.toMatch(/[01oOlI]/);
    }
  });
});

describe('pembatas laju', () => {
  it('menolak setelah batas, per kunci, lalu pulih setelah jendela', () => {
    vi.useFakeTimers();
    const rl = createRateLimiter(3, 10 * 60_000);
    expect([1, 2, 3].map(() => rl.limited('ip-a'))).toEqual([false, false, false]);
    expect(rl.limited('ip-a')).toBe(true);
    expect(rl.limited('ip-b')).toBe(false); // kunci lain tidak terpengaruh
    vi.advanceTimersByTime(10 * 60_000 + 1);
    expect(rl.limited('ip-a')).toBe(false);
    vi.useRealTimers();
  });

  it('reset membuka kembali kunci (dipakai setelah login berhasil)', () => {
    const rl = createRateLimiter(1, 60_000);
    rl.limited('u');
    expect(rl.limited('u')).toBe(true);
    rl.reset('u');
    expect(rl.limited('u')).toBe(false);
  });
});
