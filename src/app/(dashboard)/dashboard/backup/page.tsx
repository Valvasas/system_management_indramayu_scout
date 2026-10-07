import type { Metadata } from 'next';
import { AlertTriangle, CheckCircle2, Clock, DatabaseBackup, ShieldCheck, XCircle, type LucideIcon } from 'lucide-react';
import { ActionButton } from '@/components/dashboard/ConfirmButton';
import { InfoList, Notice, Panel, PortalHeader, TableWrap, td, th } from '@/components/dashboard/ui';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { lastSuccessfulBackup, recentBackups, type BackupRun } from '@/features/backup/backup';
import { runBackupAction, verifyBackupAction } from '@/features/backup/backup-actions';
import { requirePermission } from '@/lib/auth/session';
import { formatDate, formatTime } from '@/lib/format';

export const metadata: Metadata = { title: 'Backup' };

const STATUS: Record<BackupRun['status'], { label: string; tone: BadgeTone; icon: LucideIcon }> = {
  SUCCESS: { label: 'Berhasil', tone: 'success', icon: CheckCircle2 },
  FAILED: { label: 'Gagal', tone: 'danger', icon: XCircle },
  RUNNING: { label: 'Berjalan', tone: 'info', icon: Clock },
};

const when = (d: Date | null) => (d ? `${formatDate(d.toISOString())}, ${formatTime(d.toISOString())}` : '—');
const size = (n: number | null) => (n === null ? '—' : n > 1_048_576 ? `${(n / 1_048_576).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`);

export default async function BackupPage({ searchParams = {} }: { searchParams?: { hasil?: string; uji?: string } }) {
  await requirePermission('system.backup');
  const [runs, last] = await Promise.all([recentBackups(15), lastSuccessfulBackup()]);
  const ageDays = last?.finishedAt ? Math.floor((Date.now() - last.finishedAt.getTime()) / 86_400_000) : null;

  return (
    <>
      <PortalHeader
        title="Backup"
        description="Salinan basis data untuk pemulihan bila server rusak. Jadwalkan backup otomatis harian di server; tombol ini untuk backup manual (mis. sebelum pembaruan besar)."
      />
      {searchParams.hasil === 'ok' && <Notice>Backup selesai. Uji pulih untuk memastikan berkasnya bisa dipakai.</Notice>}
      {searchParams.hasil === 'gagal' && <Notice tone="warning">Backup gagal. Lihat keterangan di tabel riwayat.</Notice>}
      {searchParams.hasil === 'sibuk' && <Notice tone="info">Backup lain sedang berjalan. Coba lagi beberapa saat lagi.</Notice>}
      {searchParams.uji === 'lulus' && <Notice>Uji pulih lulus: berkas backup dapat dipulihkan.</Notice>}
      {searchParams.uji === 'gagal' && (
        <Notice tone="warning">Uji pulih GAGAL. Jangan andalkan berkas ini; buat backup baru dan periksa servernya.</Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Backup terakhir yang berhasil" className="lg:col-span-2">
          {last ? (
            <InfoList
              items={[
                { label: 'Waktu', value: when(last.finishedAt) },
                { label: 'Berkas', value: <code className="break-all font-mono text-xs">{last.fileName}</code> },
                { label: 'Ukuran', value: size(last.sizeBytes) },
                {
                  label: 'Uji pulih',
                  value: last.verifiedAt ? (
                    <span className="flex items-start gap-1.5">
                      {last.verifyNote?.startsWith('LULUS') ? (
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-status-success-text" aria-hidden="true" />
                      ) : (
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-warning-text" aria-hidden="true" />
                      )}
                      {last.verifyNote}
                    </span>
                  ) : (
                    'Belum diuji'
                  ),
                },
              ]}
            />
          ) : (
            <EmptyState variant="icon" icon={DatabaseBackup} title="Belum ada backup" description="Buat backup pertama sekarang." />
          )}
          {ageDays !== null && ageDays >= 2 && (
            <p className="mt-4 flex items-start gap-2 text-sm font-medium text-status-warning-text">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Backup terakhir sudah {ageDays} hari. Periksa jadwal backup otomatis di server.
            </p>
          )}
        </Panel>

        <Panel title="Tindakan">
          <div className="space-y-3">
            <form action={runBackupAction}>
              <Button type="submit" className="w-full">
                <DatabaseBackup className="h-4 w-4" aria-hidden="true" />
                Backup sekarang
              </Button>
            </form>
            {last && (
              <ActionButton action={verifyBackupAction.bind(null, last.id)} variant="secondary" size="md">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Uji pulih backup terakhir
              </ActionButton>
            )}
            <p className="text-sm text-text-secondary">
              Kolom sensitif di dalam backup tetap terenkripsi. Simpan kunci enkripsi di tempat terpisah dari berkas backup.
            </p>
          </div>
        </Panel>
      </div>

      <Panel title="Riwayat" className="mt-6" bodyClassName="p-0 sm:p-0">
        {runs.length === 0 ? (
          <p className="p-5 text-sm text-text-secondary">Belum ada riwayat.</p>
        ) : (
          <div className="px-5 sm:px-6">
            <TableWrap label="Riwayat backup">
              <table className="w-full min-w-[640px]">
                <caption className="sr-only">Riwayat backup terbaru</caption>
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th scope="col" className={`${th} pl-5`}>
                      Waktu
                    </th>
                    <th scope="col" className={th}>
                      Status
                    </th>
                    <th scope="col" className={th}>
                      Jenis
                    </th>
                    <th scope="col" className={th}>
                      Ukuran
                    </th>
                    <th scope="col" className={th}>
                      Oleh / keterangan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => {
                    const s = STATUS[r.status];
                    return (
                      <tr key={r.id} className="border-b border-border-subtle last:border-0">
                        <td className={`${td} pl-5 text-sm`}>{when(r.startedAt)}</td>
                        <td className={td}>
                          <Badge tone={s.tone} icon={s.icon} className="whitespace-nowrap">
                            {s.label}
                          </Badge>
                        </td>
                        <td className={`${td} text-sm`}>{r.kind === 'postgres' ? 'PostgreSQL' : 'PGlite'}</td>
                        <td className={`${td} text-sm`}>{size(r.sizeBytes)}</td>
                        <td className={`${td} text-sm text-text-secondary`}>
                          {r.triggeredByName}
                          {r.error && <span className="block text-status-danger-text">{r.error}</span>}
                          {r.verifyNote && <span className="block">{r.verifyNote}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
          </div>
        )}
      </Panel>
    </>
  );
}
