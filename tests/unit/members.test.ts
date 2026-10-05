import { describe, expect, it } from 'vitest';
import { MemberSchema } from '@/features/members/validation';
import { parseLocalDateTime, toLocalDateTime } from '@/features/content/shared';

const base = {
  fullName: 'Dimas Pratama',
  gender: 'L',
  birthDate: '2010-03-01',
  golongan: 'PENGGALANG',
  gudepId: '123e4567-e89b-12d3-a456-426614174000',
};

describe('validasi anggota (UU PDP: data anak)', () => {
  it('anggota di bawah 18 tahun wajib punya wali dan tanggal persetujuan', () => {
    const r = MemberSchema.safeParse(base);
    expect(r.success).toBe(false);
    const paths = r.success ? [] : r.error.issues.map((i) => i.path[0]);
    expect(paths).toEqual(expect.arrayContaining(['guardianName', 'guardianPhone', 'guardianConsentAt']));
  });

  it('lolos bila data wali lengkap', () => {
    const r = MemberSchema.safeParse({ ...base, guardianName: 'Ibu Sari', guardianPhone: '081234567890', guardianConsentAt: '2026-09-01' });
    expect(r.success).toBe(true);
  });

  it('dewasa tidak wajib data wali', () => {
    expect(MemberSchema.safeParse({ ...base, birthDate: '1995-03-01', golongan: 'DEWASA' }).success).toBe(true);
  });

  it('menolak tanggal lahir di masa depan dan usia di luar rentang', () => {
    expect(MemberSchema.safeParse({ ...base, birthDate: '2999-01-01' }).success).toBe(false);
    expect(MemberSchema.safeParse({ ...base, birthDate: '2024-01-01' }).success).toBe(false);
  });

  it('nama minimal 3 huruf', () => {
    expect(MemberSchema.safeParse({ ...base, fullName: 'Di', birthDate: '1995-03-01' }).success).toBe(false);
  });
});

describe('waktu agenda (WIB)', () => {
  it('menafsirkan input datetime-local sebagai WIB dan bisa dibalik', () => {
    const d = parseLocalDateTime('2026-10-17T08:00');
    expect(d?.toISOString()).toBe('2026-10-17T01:00:00.000Z');
    expect(toLocalDateTime(d)).toBe('2026-10-17T08:00');
  });

  it('menolak format lain', () => {
    expect(parseLocalDateTime('17/10/2026 08:00')).toBeNull();
    expect(toLocalDateTime(null)).toBe('');
  });
});
