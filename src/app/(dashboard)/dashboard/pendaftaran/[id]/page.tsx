import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Download, Users } from 'lucide-react';
import { Panel, PortalHeader, TableWrap, td, th } from '@/components/dashboard/ui';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { getEvent, registrantsFor } from '@/features/portal/registrations';
import { can, requirePermission } from '@/lib/auth/session';
import { golonganLabel } from '@/lib/domain';
import { formatDate, formatDateRange } from '@/lib/format';

export const metadata: Metadata = { title: 'Pendaftar kegiatan' };

export default async function PendaftarPage({ params }: { params: { id: string } }) {
  const user = await requirePermission('members.read');
  const event = await getEvent(params.id);
  if (!event || !event.published) notFound();
  const rows = await registrantsFor(user, event.id);
  const byGolongan = rows.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.golongan]: (acc[r.golongan] ?? 0) + 1 }), {});

  return (
    <>
      <PortalHeader
        title={event.title}
        description={`${formatDateRange(event.dateStart.toISOString(), event.dateEnd?.toISOString())} · ${event.location}`}
        back={{ href: '/dashboard/pendaftaran', label: 'Semua kegiatan' }}
        actions={
          can(user, 'members.export') && rows.length > 0 ? (
            <ButtonLink href={`/dashboard/pendaftaran/${event.id}/ekspor`} variant="outline">
              <Download className="h-4 w-4" aria-hidden="true" />
              Unduh CSV
            </ButtonLink>
          ) : undefined
        }
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="rounded-2xl border border-border-subtle bg-surface-base px-5 py-3">
          <p className="text-xs font-semibold text-text-secondary">Total pendaftar (wilayah Anda)</p>
          <p className="font-display text-2xl font-semibold tabular-nums text-text-primary">{rows.length}</p>
        </div>
        {Object.entries(byGolongan).map(([g, n]) => (
          <div key={g} className="rounded-2xl border border-border-subtle bg-surface-base px-5 py-3">
            <p className="text-xs font-semibold text-text-secondary">{golonganLabel(g as Parameters<typeof golonganLabel>[0])}</p>
            <p className="font-display text-2xl font-semibold tabular-nums text-text-primary">{n}</p>
          </div>
        ))}
      </div>

      <Panel>
        {rows.length === 0 ? (
          <EmptyState
            variant="icon"
            icon={Users}
            title="Belum ada pendaftar"
            description="Anggota aktif di wilayah Anda dapat mendaftar lewat menu Kegiatan di portal peserta."
          />
        ) : (
          <TableWrap label="Daftar pendaftar">
            <table className="w-full min-w-[44rem] text-base">
              <caption className="sr-only">Pendaftar {event.title}</caption>
              <thead className="border-b border-border-subtle">
                <tr>
                  <th scope="col" className={th}>
                    Nama
                  </th>
                  <th scope="col" className={th}>
                    Golongan
                  </th>
                  <th scope="col" className={th}>
                    Gudep
                  </th>
                  <th scope="col" className={th}>
                    Kwarran
                  </th>
                  <th scope="col" className={th}>
                    Mendaftar
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {rows.map((r) => (
                  <tr key={r.memberId}>
                    <td className={td}>
                      <span className="font-semibold text-text-primary">{r.fullName}</span>
                      {r.kta && <span className="block text-sm text-text-secondary">KTA {r.kta}</span>}
                    </td>
                    <td className={td}>{golonganLabel(r.golongan)}</td>
                    <td className={td}>{r.gudepName}</td>
                    <td className={td}>{r.kwarranName}</td>
                    <td className={td}>{formatDate(r.registeredAt.toISOString())}</td>
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
