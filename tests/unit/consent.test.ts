import { describe, expect, it } from 'vitest';
import { consentStatuses, dataConsentSatisfied, firstNameOf, needsGuardianConsent, type ConsentDecision } from '@/features/consent/status';
import { CONSENT_SCOPES, CONSENT_TEXT_VERSION, CONSENT_TEXTS } from '@/features/consent/texts';

const d = (day: number) => new Date(Date.UTC(2026, 9, day));
const dec = (over: Partial<ConsentDecision>): ConsentDecision => ({
  scope: 'DATA',
  granted: true,
  method: 'GUARDIAN_CODE',
  decidedAt: d(1),
  ...over,
});

describe('status persetujuan wali (1.5)', () => {
  it('tanpa keputusan → NONE di semua cakupan', () => {
    expect(Object.values(consentStatuses([])).map((s) => s.kind)).toEqual(['NONE', 'NONE', 'NONE']);
  });

  it('keputusan terbaru menang, urutan masukan tidak berpengaruh', () => {
    const s = consentStatuses([dec({ granted: false, decidedAt: d(5) }), dec({ granted: true, decidedAt: d(1) })]);
    expect(s.DATA).toEqual({ kind: 'REVOKED', at: d(5) });
    expect(consentStatuses([dec({ granted: true, decidedAt: d(9) }), dec({ granted: false, decidedAt: d(5) })]).DATA.kind).toBe('GRANTED');
  });

  it('tidak setuju sejak awal = DECLINED, bukan REVOKED', () => {
    expect(consentStatuses([dec({ scope: 'PHOTO', granted: false })]).PHOTO.kind).toBe('DECLINED');
  });

  it('tanggal manual lama tidak dianggap persetujuan terverifikasi', () => {
    const s = consentStatuses([dec({ method: 'LEGACY_MANUAL' })]);
    expect(s.DATA.kind).toBe('LEGACY');
    expect(dataConsentSatisfied(s)).toBe(false);
    // Pencabutan setelah catatan manual tetap REVOKED.
    expect(
      consentStatuses([dec({ method: 'LEGACY_MANUAL' }), dec({ granted: false, method: 'STAFF_REVOCATION', decidedAt: d(3) })]).DATA.kind,
    ).toBe('REVOKED');
  });

  it('syarat verifikasi data anak = DATA disetujui wali lewat kode', () => {
    expect(dataConsentSatisfied(consentStatuses([dec({})]))).toBe(true);
    expect(dataConsentSatisfied(consentStatuses([dec({ scope: 'ACTIVITY' })]))).toBe(false);
  });

  it('batas usia 18 tahun dan minimisasi nama', () => {
    const now = new Date(2026, 9, 6);
    expect(needsGuardianConsent('2008-10-07', now)).toBe(true);
    expect(needsGuardianConsent('2008-10-06', now)).toBe(false);
    expect(firstNameOf('  Dimas Pratama Putra ')).toBe('Dimas');
  });

  it('setiap cakupan punya teks; versi teks tercatat', () => {
    expect(CONSENT_TEXT_VERSION).toMatch(/^\d{4}-\d{2}-v\d+$/);
    for (const scope of CONSENT_SCOPES) expect(CONSENT_TEXTS[scope].body.length).toBeGreaterThan(0);
  });
});
