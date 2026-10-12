import { CheckCircle2, CircleDashed, MailCheck, XCircle, type LucideIcon } from 'lucide-react';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import type { AttendanceStatus } from '@/db/schema';
import { attendanceLabel } from '@/features/attendance/labels';

/** Ikon & nada per status presensi. Dipakai lencana, tombol, dan rekap agar maknanya konsisten. */
export const ATTENDANCE_VISUALS: Record<AttendanceStatus | 'NONE', { tone: BadgeTone; icon: LucideIcon }> = {
  PRESENT: { tone: 'success', icon: CheckCircle2 },
  EXCUSED: { tone: 'info', icon: MailCheck },
  ABSENT: { tone: 'danger', icon: XCircle },
  NONE: { tone: 'neutral', icon: CircleDashed },
};

/** Status presensi: ikon + teks (tidak pernah warna saja). */
export function AttendanceStatusBadge({ status, className }: { status: AttendanceStatus | null; className?: string }) {
  const v = ATTENDANCE_VISUALS[status ?? 'NONE'];
  return (
    <Badge tone={v.tone} icon={v.icon} className={className ?? 'whitespace-nowrap'}>
      {attendanceLabel(status)}
    </Badge>
  );
}
