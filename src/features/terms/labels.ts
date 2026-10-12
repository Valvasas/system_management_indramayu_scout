/** Label masa jabatan (2.4). Murni — aman diimpor komponen klien. */
import { formatDate, formatDateRange } from '@/lib/format';
import type { TermState } from './dates';

/** Status tampilan: "berakhir" dibedakan dari "dinonaktifkan" (diganti sebelum tanggal berakhir). */
export type TermBadgeKind = TermState | 'DEACTIVATED';

export const TERM_BADGE_LABELS: Record<TermBadgeKind, string> = {
  ACTIVE: 'Menjabat',
  ENDING: 'Hampir berakhir',
  UPCOMING: 'Belum mulai',
  ENDED: 'Berakhir',
  DEACTIVATED: 'Dinonaktifkan',
};

export function termBadgeKind(t: { state: TermState; isActive: boolean }): TermBadgeKind {
  return t.state === 'ENDED' && !t.isActive ? 'DEACTIVATED' : t.state;
}

/** "1 Januari 2026 – 31 Desember 2030", "Sejak 1 Januari 2026", atau "Tanggal belum diisi". */
export function termRangeLabel(termStart: string | null, termEnd: string | null): string {
  if (termStart && termEnd) return formatDateRange(termStart, termEnd);
  if (termStart) return `Sejak ${formatDate(termStart)}`;
  if (termEnd) return `Sampai ${formatDate(termEnd)}`;
  return 'Tanggal belum diisi';
}

/** Sisa hari dalam kalimat: 0 → "Hari ini hari terakhir". */
export function daysLeftLabel(daysLeft: number): string {
  if (daysLeft <= 0) return 'Hari ini hari terakhir';
  return daysLeft === 1 ? 'Berakhir besok' : `${daysLeft} hari lagi`;
}
