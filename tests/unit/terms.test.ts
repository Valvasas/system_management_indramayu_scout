import { describe, expect, it } from 'vitest';
import { addDaysIso, daysLeft, isCurrentTerm, termState, wibToday } from '@/features/terms/dates';
import { AssignmentSchema, BoardMemberSchema } from '@/features/terms/validation';

const form = (fields: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return Object.fromEntries(fd.entries());
};

describe('tanggal masa jabatan dihitung di WIB (2.4)', () => {
  it('pergantian hari mengikuti Asia/Jakarta, bukan UTC', () => {
    // 16.59.59 UTC = 23.59.59 WIB tanggal 11; 17.00 UTC = 00.00 WIB tanggal 12 (UTC masih tanggal 11).
    expect(wibToday(new Date('2026-10-11T16:59:59Z'))).toBe('2026-10-11');
    expect(wibToday(new Date('2026-10-11T17:00:00Z'))).toBe('2026-10-12');
    expect(wibToday(new Date('2026-12-31T18:00:00Z'))).toBe('2027-01-01');
  });

  it('aritmetika tanggal kalender melewati akhir bulan & tahun kabisat', () => {
    expect(addDaysIso('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDaysIso('2026-10-11', 30)).toBe('2026-11-10');
    expect(addDaysIso('2027-01-01', -1)).toBe('2026-12-31');
    expect(() => addDaysIso('11-10-2026', 1)).toThrow();
  });
});

describe('status masa jabatan', () => {
  const today = '2026-10-11';
  const legacy = { isActive: true, termStart: null, termEnd: null };

  it('data lama (tanpa tanggal, aktif) tetap menjabat — default aman', () => {
    expect(isCurrentTerm(legacy, today)).toBe(true);
    expect(termState(legacy, today)).toBe('ACTIVE');
    expect(daysLeft(legacy, today)).toBeNull();
  });

  it('hari terakhir masih menjabat; sehari setelahnya masuk riwayat', () => {
    expect(isCurrentTerm({ ...legacy, termEnd: today }, today)).toBe(true);
    expect(isCurrentTerm({ ...legacy, termEnd: '2026-10-10' }, today)).toBe(false);
    expect(termState({ ...legacy, termEnd: '2026-10-10' }, today)).toBe('ENDED');
  });

  it('nonaktif manual berakhir walau tanggal masih jauh; belum mulai belum menjabat', () => {
    expect(isCurrentTerm({ isActive: false, termStart: null, termEnd: '2030-01-01' }, today)).toBe(false);
    expect(isCurrentTerm({ ...legacy, termStart: '2026-10-12' }, today)).toBe(false);
    expect(termState({ ...legacy, termStart: '2026-10-12' }, today)).toBe('UPCOMING');
    expect(isCurrentTerm({ ...legacy, termStart: today }, today)).toBe(true);
  });

  it('"hampir berakhir" = sisa 0–30 hari', () => {
    expect(termState({ ...legacy, termEnd: today }, today)).toBe('ENDING');
    expect(termState({ ...legacy, termEnd: '2026-11-10' }, today)).toBe('ENDING');
    expect(daysLeft({ termEnd: '2026-11-10' }, today)).toBe(30);
    expect(termState({ ...legacy, termEnd: '2026-11-11' }, today)).toBe('ACTIVE');
  });
});

describe('validasi formulir pengurus', () => {
  const base = { name: 'Kak Uji', position: 'Sekretaris', department: 'Pimpinan', period: '2026–2031', sortOrder: '1' };

  it('tanggal berakhir sebelum tanggal mulai ditolak', () => {
    const r = BoardMemberSchema.safeParse(form({ ...base, termStart: '2026-05-01', termEnd: '2026-04-30', isActive: 'on' }));
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]).toMatchObject({ path: ['termEnd'] });
  });

  it('sama dengan tanggal mulai boleh; kosong → null; kotak aktif tak dicentang → nonaktif', () => {
    const same = BoardMemberSchema.parse(form({ ...base, termStart: '2026-05-01', termEnd: '2026-05-01', isActive: 'on' }));
    expect(same).toMatchObject({ termStart: '2026-05-01', termEnd: '2026-05-01', isActive: true });
    const empty = BoardMemberSchema.parse(form({ ...base, termStart: '', termEnd: '' }));
    expect(empty).toMatchObject({ termStart: null, termEnd: null, isActive: false });
  });

  it('tanggal yang tidak ada di kalender ditolak (bukan digulirkan)', () => {
    expect(BoardMemberSchema.safeParse(form({ ...base, termEnd: '2026-02-31' })).success).toBe(false);
    expect(BoardMemberSchema.safeParse(form({ ...base, termEnd: '31/12/2026' })).success).toBe(false);
  });
});

describe('validasi formulir penugasan staf', () => {
  const gudepId = '11111111-1111-4111-8111-111111111111';

  it('berakhir < mulai ditolak; tanggal mulai wajib', () => {
    const r = AssignmentSchema.safeParse(
      form({ position: 'Pembina', role: 'STAFF_GUDEP', gudepId, termStart: '2026-07-01', termEnd: '2026-06-30' }),
    );
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.path[0])).toContain('termEnd');
    expect(AssignmentSchema.safeParse(form({ position: 'Pembina', role: 'STAFF_GUDEP', gudepId, termStart: '' })).success).toBe(false);
  });

  it('peran berwilayah wajib wilayahnya; peran peserta tidak bisa jadi penugasan', () => {
    const noGudep = AssignmentSchema.safeParse(form({ position: 'Pembina', role: 'STAFF_GUDEP', termStart: '2026-07-01' }));
    expect(noGudep.error?.issues.map((i) => i.path[0])).toContain('gudepId');
    const noKwarran = AssignmentSchema.safeParse(form({ position: 'Andalan', role: 'STAFF_KWARRAN', termStart: '2026-07-01' }));
    expect(noKwarran.error?.issues.map((i) => i.path[0])).toContain('kwarranId');
    expect(AssignmentSchema.safeParse(form({ position: 'X', role: 'PESERTA', termStart: '2026-07-01' })).success).toBe(false);
    expect(AssignmentSchema.safeParse(form({ position: 'X', role: 'STAFF_GUDEP', gudepId: 'bukan-uuid', termStart: '2026-07-01' })).success).toBe(
      false,
    );
  });

  it('penugasan valid', () => {
    expect(AssignmentSchema.parse(form({ position: ' Pembina Gudep ', role: 'STAFF_GUDEP', gudepId, termStart: '2026-07-01' }))).toEqual({
      position: 'Pembina Gudep',
      role: 'STAFF_GUDEP',
      kwarranId: null,
      gudepId,
      termStart: '2026-07-01',
      termEnd: null,
    });
  });
});
