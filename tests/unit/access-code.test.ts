import { describe, expect, it } from 'vitest';
import { accessCodeMatches, generateAccessCode, hashAccessCode, isValidAccessCodeShape, normalizeAccessCode } from '@/lib/auth/access-code';

describe('kode akses sekali pakai', () => {
  it('format XXXX-XXXX tanpa karakter membingungkan', () => {
    for (let i = 0; i < 200; i++) {
      const c = generateAccessCode();
      expect(c).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
      expect(c).not.toMatch(/[01OIL]/);
      expect(isValidAccessCodeShape(c)).toBe(true);
    }
  });

  it('masukan longgar tetap cocok (huruf kecil, spasi, tanpa tanda hubung)', () => {
    const code = generateAccessCode();
    const hash = hashAccessCode(code);
    expect(accessCodeMatches(code.toLowerCase(), hash)).toBe(true);
    expect(accessCodeMatches(code.replace('-', ' '), hash)).toBe(true);
    expect(normalizeAccessCode(' ab-cd 2345 ')).toBe('ABCD2345');
  });

  it('kode lain / hash rusak tidak cocok', () => {
    const hash = hashAccessCode('ABCD-2345');
    expect(accessCodeMatches('ABCD-2346', hash)).toBe(false);
    expect(accessCodeMatches('ABCD-2345', 'bukan-hex')).toBe(false);
  });

  it('hash tidak memuat kode asli', () => {
    expect(hashAccessCode('ABCD-2345')).not.toContain('ABCD');
  });

  it('menolak bentuk yang mustahil sebelum menyentuh basis data', () => {
    expect(isValidAccessCodeShape('ABCD-234')).toBe(false);
    expect(isValidAccessCodeShape('ABCD-23O5')).toBe(false); // O tidak ada di alfabet
  });

  it('cukup acak: 500 kode tanpa duplikat', () => {
    expect(new Set(Array.from({ length: 500 }, generateAccessCode)).size).toBe(500);
  });
});

describe('hash kode berkunci server (hasil review keamanan)', () => {
  it('bukan SHA-256 polos: dump DB saja tidak cukup untuk menebak kode secara offline', async () => {
    const { createHash } = await import('node:crypto');
    const plain = createHash('sha256')
      .update(`rp-access:${normalizeAccessCode('ABCD-2345')}`)
      .digest('hex');
    expect(hashAccessCode('ABCD-2345')).not.toBe(plain);
  });

  it('kode pemulihan MFA terikat akun: kode sama di akun lain menghasilkan hash berbeda', async () => {
    const { hashRecoveryCode } = await import('@/features/auth/mfa');
    expect(hashRecoveryCode('akun-a', 'ABCD-2345')).not.toBe(hashRecoveryCode('akun-b', 'ABCD-2345'));
    expect(hashRecoveryCode('akun-a', 'abcd 2345')).toBe(hashRecoveryCode('akun-a', 'ABCD-2345'));
  });
});
