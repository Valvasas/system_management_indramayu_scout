import { describe, expect, it } from 'vitest';
import { ageOn, slugify, suggestedGolongan } from '@/lib/domain';

const at = new Date('2026-10-05T00:00:00Z');

describe('usia & golongan', () => {
  it('menghitung usia dengan memperhatikan ulang tahun yang belum tiba', () => {
    expect(ageOn('2010-10-05', at)).toBe(16);
    expect(ageOn('2010-10-06', at)).toBe(15);
  });

  it.each([
    ['2018-01-01', 'SIAGA'],
    ['2013-01-01', 'PENGGALANG'],
    ['2009-01-01', 'PENEGAK'],
    ['2003-01-01', 'PANDEGA'],
    ['1990-01-01', 'DEWASA'],
  ])('lahir %s → %s', (birth, expected) => {
    expect(suggestedGolongan(birth, at)).toBe(expected);
  });

  it('terlalu muda atau tanggal rusak → null', () => {
    expect(suggestedGolongan('2023-01-01', at)).toBeNull();
    expect(suggestedGolongan('bukan-tanggal', at)).toBeNull();
  });
});

describe('slugify', () => {
  it('menormalkan judul berbahasa Indonesia', () => {
    expect(slugify('Pelantikan Pengurus Kwarcab 2026!')).toBe('pelantikan-pengurus-kwarcab-2026');
    expect(slugify('  Café — Jambore  ')).toBe('cafe-jambore');
  });

  it('terpotong 80 karakter tanpa tanda hubung di ujung', () => {
    const s = slugify('kata '.repeat(40));
    expect(s.length).toBeLessThanOrEqual(80);
    expect(s.endsWith('-')).toBe(false);
  });

  it('judul tanpa huruf/angka menghasilkan string kosong', () => {
    expect(slugify('!!!')).toBe('');
  });
});
