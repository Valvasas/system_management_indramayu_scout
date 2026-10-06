import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionButton } from '@/components/dashboard/ConfirmButton';
import { Notice, Panel, PortalHeader, PublishBadge, TableWrap, td, th } from '@/components/dashboard/ui';
import { deleteEventAction } from '@/features/content/events';
import { listEventsAdmin } from '@/features/content/queries';
import { registrationTotals } from '@/features/portal/registrations';
import { requirePermission } from '@/lib/auth/session';
import { formatDate, formatTime } from '@/lib/format';

export const metadata: Metadata = { title: 'Agenda' };

export default async function AgendaAdminPage({ searchParams = {} }: { searchParams?: { tersimpan?: string; dihapus?: string } }) {
  await requirePermission('content.manage');
  const [rows, totals] = await Promise.all([listEventsAdmin(), registrationTotals()]);

  return (
    <>
      <PortalHeader
        title="Agenda"
        back={{ href: '/dashboard/konten', label: 'Konten situs' }}
        description="Jadwal kegiatan Kwarcab. Buka pendaftaran agar peserta bisa mendaftar dari dasbor."
        actions={
          <ButtonLink href="/dashboard/konten/agenda/baru">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tambah agenda
          </ButtonLink>
        }
      />
      {searchParams.tersimpan && <Notice>Agenda tersimpan.</Notice>}
      {searchParams.dihapus && <Notice>Agenda dihapus.</Notice>}

      <Panel>
        {rows.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Belum ada agenda"
            description="Tambahkan kegiatan pertama agar tampil di halaman Agenda."
          />
        ) : (
          <TableWrap label="Daftar agenda">
            <table className="w-full min-w-[44rem] text-base">
              <caption className="sr-only">Daftar agenda, kegiatan terjauh di atas</caption>
              <thead className="border-b border-border-subtle">
                <tr>
                  <th scope="col" className={th}>
                    Kegiatan
                  </th>
                  <th scope="col" className={th}>
                    Waktu
                  </th>
                  <th scope="col" className={th}>
                    Status
                  </th>
                  <th scope="col" className={th}>
                    Pendaftaran
                  </th>
                  <th scope="col" className={th}>
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {rows.map((e) => (
                  <tr key={e.id}>
                    <td className={td}>
                      <Link href={`/dashboard/konten/agenda/${e.id}`} className="font-semibold text-text-primary hover:underline">
                        {e.title}
                      </Link>
                      <p className="text-sm text-text-secondary">{e.location}</p>
                    </td>
                    <td className={td}>
                      {formatDate(e.dateStart.toISOString())}
                      <p className="text-sm text-text-secondary">{formatTime(e.dateStart.toISOString())}</p>
                    </td>
                    <td className={td}>
                      <PublishBadge published={e.published} draftLabel="Draf" />
                      {e.cancelled && <p className="mt-1 text-sm font-medium text-status-danger-text">Dibatalkan</p>}
                    </td>
                    <td className={td}>
                      {e.registrationOpen ? 'Dibuka' : 'Ditutup'}
                      <span className="block text-sm text-text-secondary">{totals.get(e.id) ?? 0} pendaftar</span>
                    </td>
                    <td className={td}>
                      <ActionButton
                        action={deleteEventAction.bind(null, e.id)}
                        variant="ghost"
                        confirm={`Hapus agenda "${e.title}"?`}
                        label={`Hapus agenda ${e.title}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Hapus
                      </ActionButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>
    </>
  );
}
