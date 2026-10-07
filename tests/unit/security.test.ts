import { describe, expect, it } from 'vitest';
import { hashPassword, passwordProblem, verifyPassword } from '@/lib/auth/password';

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
});

// Pembatas laju: lihat tests/integration/rate-limit.test.ts (store PostgreSQL bersama).
