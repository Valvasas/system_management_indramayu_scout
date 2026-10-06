/**
 * Status persetujuan wali (murni, tanpa I/O — diuji di tests/unit/consent.test.ts).
 * Catatan bersifat append-only; status terkini per cakupan = keputusan terbaru.
 */
import type { ConsentMethod, ConsentScope } from '@/db/schema';
import { ageOn } from '@/lib/domain';
import { CONSENT_SCOPES } from './texts';

export type ConsentStatusKind =
  /** Belum pernah ada keputusan. */
  | 'NONE'
  /** Disetujui wali lewat kode sekali pakai (terverifikasi). */
  | 'GRANTED'
  /** Hanya ada tanggal manual lama dari staf (belum terverifikasi). */
  | 'LEGACY'
  /** Wali memilih tidak setuju sejak awal. */
  | 'DECLINED'
  /** Pernah disetujui lalu dicabut. */
  | 'REVOKED';

export interface ConsentDecision {
  scope: ConsentScope;
  granted: boolean;
  method: ConsentMethod;
  decidedAt: Date;
}

export interface ConsentStatus {
  kind: ConsentStatusKind;
  at: Date | null;
}

export function consentStatuses(decisions: readonly ConsentDecision[]): Record<ConsentScope, ConsentStatus> {
  const out = {} as Record<ConsentScope, ConsentStatus>;
  for (const scope of CONSENT_SCOPES) {
    const list = decisions.filter((d) => d.scope === scope).sort((a, b) => a.decidedAt.getTime() - b.decidedAt.getTime());
    const latest = list[list.length - 1];
    if (!latest) out[scope] = { kind: 'NONE', at: null };
    else if (latest.granted) out[scope] = { kind: latest.method === 'LEGACY_MANUAL' ? 'LEGACY' : 'GRANTED', at: latest.decidedAt };
    else out[scope] = { kind: list.some((d) => d.granted) ? 'REVOKED' : 'DECLINED', at: latest.decidedAt };
  }
  return out;
}

/** Anak (di bawah 18 tahun) wajib persetujuan wali (UU PDP No. 27/2022). */
export const needsGuardianConsent = (birthDate: string, now = new Date()) => ageOn(birthDate, now) < 18;

/** Syarat verifikasi data anak: persetujuan DATA dari wali yang terverifikasi (bukan tanggal manual). */
export const dataConsentSatisfied = (s: Record<ConsentScope, ConsentStatus>) => s.DATA.kind === 'GRANTED';

/** Nama depan saja yang ditampilkan ke pemegang kode (minimisasi data). */
export const firstNameOf = (fullName: string) => fullName.trim().split(/\s+/)[0] ?? '';
