import { Users } from 'lucide-react';
import type { AttendanceRecap } from '@/features/attendance/labels';
import { ATTENDANCE_LABELS, NOT_RECORDED_LABEL } from '@/features/attendance/labels';
import { ATTENDANCE_VISUALS } from './AttendanceStatusBadge';

/** Rekap presensi: setiap angka berlabel teks + ikon (tidak bergantung warna). */
export function AttendanceRecapTiles({ recap }: { recap: AttendanceRecap }) {
  const tiles = [
    { key: 'total', label: 'Total pendaftar', value: recap.total, icon: Users },
    { key: 'PRESENT', label: ATTENDANCE_LABELS.PRESENT, value: recap.present, icon: ATTENDANCE_VISUALS.PRESENT.icon },
    { key: 'EXCUSED', label: ATTENDANCE_LABELS.EXCUSED, value: recap.excused, icon: ATTENDANCE_VISUALS.EXCUSED.icon },
    { key: 'ABSENT', label: ATTENDANCE_LABELS.ABSENT, value: recap.absent, icon: ATTENDANCE_VISUALS.ABSENT.icon },
    { key: 'NONE', label: NOT_RECORDED_LABEL, value: recap.notRecorded, icon: ATTENDANCE_VISUALS.NONE.icon },
  ];
  return (
    <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map(({ key, label, value, icon: Icon }) => (
        <div key={key} className="rounded-2xl border border-border-subtle bg-surface-base px-5 py-3">
          <dt className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {label}
          </dt>
          <dd className="font-display text-2xl font-semibold tabular-nums text-text-primary">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
