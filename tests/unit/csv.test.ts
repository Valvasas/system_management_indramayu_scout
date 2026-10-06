import { describe, expect, it } from 'vitest';
import { normalizeDate, parseCsv, toCsv } from '@/lib/csv';

describe('CSV', () => {
  it('menetralkan CSV injection (= + - @)', () => {
    const csv = toCsv(['nama'], [['=HYPERLINK("http://jahat")'], ['+1'], ['-2'], ['@x'], ['aman']]);
    const lines = csv.replace('﻿', '').trim().split('\r\n');
    expect(lines.slice(1).every((l) => !/^[=+\-@]/.test(l.replace(/^"/, '')))).toBe(true);
    expect(lines[5]).toBe('aman');
  });

  it('pulang-pergi: ekspor lalu impor menghasilkan data sama, termasuk kutip dan baris baru', () => {
    const rows = [['Budi; Santoso', 'Jl. "Mawar"\nNo. 1', '']];
    const parsed = parseCsv(toCsv(['a', 'b', 'c'], rows));
    expect(parsed[0]).toEqual(['a', 'b', 'c']);
    expect(parsed[1]).toEqual(rows[0]);
  });

  it('mendeteksi pemisah koma maupun titik koma', () => {
    expect(parseCsv('a,b\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
    expect(parseCsv('a;b\n1;2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('membuang baris kosong dan BOM', () => {
    expect(parseCsv('﻿a;b\r\n\r\n1;2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('normalizeDate menerima beberapa format dan menolak sisanya', () => {
    expect(normalizeDate('2026-1-5')).toBe('2026-01-05');
    expect(normalizeDate('05/10/2026')).toBe('2026-10-05');
    expect(normalizeDate('05-10-2026')).toBe('2026-10-05');
    expect(normalizeDate('besok')).toBeNull();
    expect(normalizeDate('')).toBeNull();
  });
});
