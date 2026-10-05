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
