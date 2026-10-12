import { describe, expect, it } from 'vitest';
import { percentOf, progressLabel, summarizeProgress, type RequirementLike, type VerificationLike } from '@/features/competency/progress';

const req = (code: string, over: Partial<RequirementLike> = {}): RequirementLike => ({
  id: code,
  kind: 'SKU',
  golongan: 'PENGGALANG',
  level: 'Ramu',
  code,
  title: `Contoh ${code}`,
  description: null,
  sortOrder: 0,
  active: true,
  ...over,
});
const at = new Date('2026-10-01T00:00:00Z');
const ver = (requirementId: string, over: Partial<VerificationLike> = {}): VerificationLike => ({
  requirementId,
  verifiedAt: at,
  verifiedByName: 'Kak Uji',
  note: null,
  revokedAt: null,
  revokedByName: null,
  ...over,
});

describe('summarizeProgress (SKU/SKK)', () => {
  it('mengelompokkan per jenis + tingkatan; urutan tingkatan menurut sortOrder terkecil', () => {
    const groups = summarizeProgress(
      'PENGGALANG',
      [
        req('T1', { level: 'Terap', sortOrder: 201 }),
        req('K1', { level: 'Rakit', sortOrder: 101 }),
        req('S1', { kind: 'SKK', level: 'Berkemah', sortOrder: 1 }),
        req('R2', { sortOrder: 2 }),
        req('R1', { sortOrder: 1 }),
      ],
      [],
    );
    expect(groups.map((g) => `${g.kind} ${g.level}`)).toEqual(['SKU Ramu', 'SKU Rakit', 'SKU Terap', 'SKK Berkemah']);
    expect(groups[0].items.map((i) => i.requirement.code)).toEqual(['R1', 'R2']);
  });

  it('mengabaikan syarat nonaktif, golongan lain, dan verifikasi dibatalkan', () => {
    const groups = summarizeProgress(
      'PENGGALANG',
      [req('R1'), req('R2'), req('R3'), req('OFF', { active: false }), req('SG', { golongan: 'SIAGA' })],
      [ver('R1'), ver('R2', { revokedAt: at, revokedByName: 'Kak Lain', note: 'Salah catat' }), ver('OFF'), ver('SG'), ver('TIDAK-ADA')],
    );
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ verified: 1, total: 3, percent: 33, lastVerifiedAt: at });
    expect(groups[0].items[1]).toMatchObject({ verified: null, revoked: { byName: 'Kak Lain', note: 'Salah catat' } });
    expect(progressLabel(groups[0])).toBe('1 dari 3 terverifikasi');
  });

  it('persentase dibulatkan ke bawah; 100 hanya bila lengkap; nol syarat = 0', () => {
    expect(percentOf(2, 3)).toBe(66);
    expect(percentOf(29, 30)).toBe(96);
    expect(percentOf(30, 30)).toBe(100);
    expect(percentOf(0, 0)).toBe(0);
    expect(summarizeProgress('PANDEGA', [req('R1')], [ver('R1')])).toEqual([]);
  });
});
