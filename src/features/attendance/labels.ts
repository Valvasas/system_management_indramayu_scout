/** Label & konstanta presensi (2.2). Murni — aman diimpor komponen klien. */
import type { AttendanceStatus } from '@/db/schema';

export const ATTENDANCE_STATUSES = ['PRESENT', 'EXCUSED', 'ABSENT'] as const satisfies readonly AttendanceStatus[];

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: 'Hadir',
  EXCUSED: 'Izin',
  ABSENT: 'Alpa',
};

export const NOT_RECORDED_LABEL = 'Belum dicatat';

/** Batas panjang catatan presensi (divalidasi Zod di server). */
export const ATTENDANCE_NOTE_MAX = 200;

export const attendanceLabel = (status: AttendanceStatus | null | undefined) => (status ? ATTENDANCE_LABELS[status] : NOT_RECORDED_LABEL);

export interface AttendanceRecap {
  present: number;
  excused: number;
  absent: number;
  notRecorded: number;
  total: number;
}

/** Rekap jumlah per status dari daftar pendaftar (status null = belum dicatat). */
export function recapOf(rows: readonly { status: AttendanceStatus | null }[]): AttendanceRecap {
  const recap: AttendanceRecap = { present: 0, excused: 0, absent: 0, notRecorded: 0, total: rows.length };
  for (const r of rows) {
    if (r.status === 'PRESENT') recap.present++;
    else if (r.status === 'EXCUSED') recap.excused++;
    else if (r.status === 'ABSENT') recap.absent++;
    else recap.notRecorded++;
  }
  return recap;
}
