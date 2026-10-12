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
    // Tanggal manual lama diketik staf (bisa saja di masa depan): tidak pernah mengalahkan
    // keputusan wali atau pencabutan yang tercatat sistem.
    const recorded = list.filter((d) => d.method !== 'LEGACY_MANUAL');
    const latest = recorded.length > 0 ? recorded[recorded.length - 1] : list[list.length - 1];
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

/**
 * Status awal anggota baru (formulir & impor). Verifikator langsung mengaktifkan orang DEWASA;
 * anak selalu menunggu, karena persetujuan wali baru bisa diminta setelah datanya tersimpan.
 */
export const initialMemberStatus = (canVerify: boolean, birthDate: string, now = new Date()) =>
  canVerify && !needsGuardianConsent(birthDate, now) ? ('ACTIVE' as const) : ('PENDING' as const);

/**
 * Status setelah data anggota diubah. Pengubah tanpa hak verifikasi → kembali ke antrean.
 * Verifikator mempertahankan status, KECUALI perubahan (mis. tanggal lahir dikoreksi) menjadikan
 * anggota AKTIF sebagai anak tanpa persetujuan DATA dari wali: ia kembali menunggu verifikasi.
 */
export function statusAfterEdit<S extends string>(input: {
  current: S;
  canVerify: boolean;
  birthDate: string;
  statuses: Record<ConsentScope, ConsentStatus>;
  now?: Date;
}): S | 'PENDING' {
  if (!input.canVerify) return 'PENDING';
  if (input.current === 'ACTIVE' && needsGuardianConsent(input.birthDate, input.now) && !dataConsentSatisfied(input.statuses))
    return 'PENDING';
  return input.current;
}

/**
 * Alasan akun portal TIDAK boleh dibuat untuk anggota anak (null = boleh). Akun adalah pemrosesan
 * baru atas data anak, jadi syaratnya sama dengan verifikasi: persetujuan DATA terverifikasi.
 */
export function portalAccountBlock(birthDate: string, statuses: Record<ConsentScope, ConsentStatus>, now = new Date()) {
  if (!needsGuardianConsent(birthDate, now)) return null;
  if (dataConsentWithdrawn(statuses)) return 'ditolak' as const;
  if (!dataConsentSatisfied(statuses)) return 'belum' as const;
  return null;
}

/** Wali menolak/mencabut persetujuan data pribadi → tidak boleh ada pemrosesan baru. */
export const dataConsentWithdrawn = (s: Record<ConsentScope, ConsentStatus>) => s.DATA.kind === 'REVOKED' || s.DATA.kind === 'DECLINED';

/** Nama depan saja yang ditampilkan ke pemegang kode (minimisasi data). */
export const firstNameOf = (fullName: string) => fullName.trim().split(/\s+/)[0] ?? '';
