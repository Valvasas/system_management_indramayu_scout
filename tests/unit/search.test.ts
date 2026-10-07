import { describe, expect, it } from 'vitest';
import { highlight, scoreText, snippet, tokenize } from '@/lib/search';

describe('pencarian situs', () => {
  it('tokenisasi: huruf kecil, buang tanda baca & token 1 huruf, maksimal 8', () => {
    expect(tokenize('Kemah, Penggalang! a')).toEqual(['kemah', 'penggalang']);
    expect(tokenize('a b c d e f g h i j k l m n o p q r s t u v w x y z aa bb cc dd ee ff gg hh ii jj').length).toBeLessThanOrEqual(8);
  });

  it('semua kata wajib cocok; judul berbobot lebih tinggi', () => {
    expect(scoreText(['kemah', 'bakti'], 'Perkemahan Bakti', '')).toBeGreaterThan(
      scoreText(['kemah', 'bakti'], 'Agenda', 'perkemahan bakti'),
    );
    expect(scoreText(['kemah', 'jambore'], 'Perkemahan Bakti', 'tanpa kata kedua')).toBe(0);
  });

  it('tidak peka diakritik', () => {
    expect(scoreText(tokenize('cafe'), 'Café Pramuka')).toBeGreaterThan(0);
  });

  it('highlight menandai bagian yang cocok tanpa mengubah teks', () => {
    const parts = highlight('Kursus Mahir Dasar', ['mahir']);
    expect(parts.map((p) => p.text).join('')).toBe('Kursus Mahir Dasar');
    expect(parts.find((p) => p.match)?.text).toBe('Mahir');
  });

  it('snippet memotong di sekitar kecocokan', () => {
    const s = snippet('x'.repeat(300) + ' jambore ' + 'y'.repeat(300), ['jambore'], 20);
    expect(s).toContain('jambore');
    expect(s.startsWith('…')).toBe(true);
    expect(s.endsWith('…')).toBe(true);
  });
});
