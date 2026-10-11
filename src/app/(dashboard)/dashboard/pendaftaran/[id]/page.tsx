import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ClipboardCheck, Download, Users } from 'lucide-react';
import { AttendanceControls } from '@/components/dashboard/attendance/AttendanceControls';
import { AttendanceRecapTiles } from '@/components/dashboard/attendance/AttendanceRecapTiles';
import { AttendanceStatusBadge } from '@/components/dashboard/attendance/AttendanceStatusBadge';
import { Notice, Panel, PortalHeader } from '@/components/dashboard/ui';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { attendanceSheet } from '@/features/attendance/attendance';
import { recordAttendanceAction } from '@/features/attendance/attendance-actions';
import { can, requirePermission } from '@/lib/auth/session';
import { golonganLabel } from '@/lib/domain';
import { formatDate, formatDateRange, formatTime } from '@/lib/format';

export const metadata: Metadata = { title: 'Pendaftar kegiatan' };

export default async function PendaftarPage({ params }: { params: { id: string } }) {
  const user = await requirePermission('members.read');
  // Lembar presensi = pendaftar dalam cakupan pengguna saja (memberScope), + status presensinya.
  const sheet = await attendanceSheet(user, params.id);
  if (!sheet) notFound();
  const { event, rows, recap, canRecord, blocked, opensAt } = sheet;
  const byGolongan = rows.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.golongan]: (acc[r.golongan] ?? 0) + 1 }), {});
  const canExport = can(user, 'members.export') && rows.length > 0;

  return (
    <>
      <PortalHeader
        title={event.title}
        description={`${formatDateRange(event.dateStart.toISOString(), event.dateEnd?.toISOString())} · ${event.location}`}
        back={{ href: '/dashboard/pendaftaran', label: 'Semua kegiatan' }}
        actions={
          canExport ? (
            <>
              <ButtonLink href={`/dashboard/pendaftaran/${event.id}/ekspor`} variant="outline">
                <Download className="h-4 w-4" aria-hidden="true" />
                Unduh CSV
              </ButtonLink>
              {can(user, 'attendance.record') && (
                <ButtonLink href={`/dashboard/pendaftaran/${event.id}/presensi/ekspor`} variant="outline">
                  <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                  Unduh presensi
                </ButtonLink>
              )}
            </>
          ) : undefined
        }
      />

      {blocked === 'belum-dimulai' && rows.length > 0 && (
        <Notice tone="info">Presensi dapat dicatat mulai {formatDate(opensAt.toISOString())}, hari pelaksanaan kegiatan.</Notice>
      )}
      {blocked === 'dibatalkan' && <Notice tone="warning">Kegiatan ini dibatalkan, sehingga presensi tidak dicatat.</Notice>}

      <AttendanceRecapTiles recap={recap} />
      {rows.length > 0 && (
        <p className="-mt-3 mb-6 text-sm text-text-secondary">
          Wilayah Anda:{' '}
          {Object.entries(byGolongan)
            .map(([g, n]) => `${golonganLabel(g as Parameters<typeof golonganLabel>[0])} ${n}`)
            .join(' · ')}
        </p>
      )}

      <Panel
        id="presensi"
        title="Pendaftar & presensi"
        description={canRecord ? 'Pilih Hadir, Izin, atau Alpa untuk setiap pendaftar. Pilihan dapat diubah kapan saja.' : undefined}
      >
        {rows.length === 0 ? (
          <EmptyState
            variant="icon"
            icon={Users}
            title="Belum ada pendaftar"
            description="Anggota aktif di wilayah Anda dapat mendaftar lewat menu Kegiatan di portal peserta."
          />
        ) : (
          <ul className="-my-4 divide-y divide-border-subtle" aria-label={`Pendaftar ${event.title}`}>
            {rows.map((r) => (
              <li key={r.memberId} className="flex flex-col gap-3 py-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
                <div className="min-w-0">
                  <h3 className="font-semibold text-text-primary">{r.fullName}</h3>
                  <p className="mt-0.5 text-sm text-text-secondary">
                    {[r.kta ? `KTA ${r.kta}` : null, golonganLabel(r.golongan), r.gudepName, r.kwarranName].filter(Boolean).join(' · ')}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <AttendanceStatusBadge status={r.status} />
                    {r.recordedAt && r.recordedByName && (
                      <span className="text-xs text-text-muted">
                        oleh {r.recordedByName}, {formatDate(r.recordedAt.toISOString())} {formatTime(r.recordedAt.toISOString())}
                      </span>
                    )}
                  </div>
                  {r.note && <p className="mt-1.5 max-w-prose whitespace-pre-line text-sm text-text-secondary">Catatan: {r.note}</p>}
                </div>
                {canRecord && r.recordable && (
                  <div className="w-full shrink-0 lg:w-96">
                    <AttendanceControls
                      action={recordAttendanceAction.bind(null, event.id, r.memberId)}
                      memberId={r.memberId}
                      memberName={r.fullName}
                      current={r.status}
                      note={r.note}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
