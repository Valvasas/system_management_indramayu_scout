/**
 * Aturan murni masa jabatan (2.4): pengurus Kwarcab & penugasan staf.
 *
 * Semua tanggal masa jabatan bertipe `date` (YYYY-MM-DD, tanpa jam) dan dibandingkan dengan
 * "hari ini" di Asia/Jakarta (WIB, UTC+7 tanpa DST). Memakai tanggal UTC akan keliru tujuh jam:
 * pukul 00.00–06.59 WIB tanggal UTC masih kemarin.
 */

/** Jendela pengingat "jabatan hampir berakhir", dalam hari (termasuk hari ini). */
export const TERM_REMINDER_DAYS = 30;

const WIB_OFFSET_MS = 7 * 3600_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Tanggal hari ini di WIB sebagai YYYY-MM-DD. */
export function wibToday(now: Date = new Date()): string {
  return new Date(now.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

/** Tambah/kurangi hari pada tanggal YYYY-MM-DD (aritmetika kalender, bebas zona waktu). */
export function addDaysIso(isoDate: string, days: number): string {
  if (!ISO_DATE.test(isoDate)) throw new Error(`Tanggal tidak valid: ${isoDate}`);
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Selisih hari kalender `to - from` (keduanya YYYY-MM-DD). */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export interface TermFields {
  isActive: boolean;
  termStart: string | null;
  termEnd: string | null;
}

export type TermState =
  /** Dinonaktifkan manual atau tanggal berakhir sudah lewat → "Riwayat periode". */
  | 'ENDED'
  /** Belum mulai (tanggal mulai di masa depan) → belum tampil di situs publik. */
  | 'UPCOMING'
  /** Sedang menjabat dan berakhir dalam ≤ TERM_REMINDER_DAYS hari. */
  | 'ENDING'
  /** Sedang menjabat. Data lama (tanggal kosong, aktif) masuk sini: default aman, tetap tampil. */
  | 'ACTIVE';

/**
 * Sedang menjabat pada `today`: aktif DAN (berakhir kosong ATAU berakhir ≥ hari ini) DAN
 * (mulai kosong ATAU mulai ≤ hari ini). Hari terakhir masa jabatan masih dihitung menjabat.
 */
export function isCurrentTerm(t: TermFields, today: string): boolean {
  return t.isActive && (t.termEnd === null || t.termEnd >= today) && (t.termStart === null || t.termStart <= today);
}

export function termState(t: TermFields, today: string): TermState {
  if (!t.isActive || (t.termEnd !== null && t.termEnd < today)) return 'ENDED';
  if (t.termStart !== null && t.termStart > today) return 'UPCOMING';
  if (t.termEnd !== null && daysBetween(today, t.termEnd) <= TERM_REMINDER_DAYS) return 'ENDING';
  return 'ACTIVE';
}

/** Sisa hari sampai tanggal berakhir (0 = hari ini hari terakhir). `null` bila tanpa tanggal berakhir. */
export function daysLeft(t: Pick<TermFields, 'termEnd'>, today: string): number | null {
  return t.termEnd === null ? null : daysBetween(today, t.termEnd);
}
