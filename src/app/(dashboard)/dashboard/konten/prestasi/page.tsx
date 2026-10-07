import type { Metadata } from 'next';
import Link from 'next/link';
import { Award, Plus, Trash2 } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionButton } from '@/components/dashboard/ConfirmButton';
import { Notice, Panel, PortalHeader, PublishBadge, TableWrap, td, th } from '@/components/dashboard/ui';
import { deleteAchievementAction } from '@/features/content/organization';
import { listAchievementsAdmin } from '@/features/content/queries';
import { requirePermission } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Prestasi' };

export default async function PrestasiAdminPage({ searchParams = {} }: { searchParams?: { tersimpan?: string; dihapus?: string } }) {
  await requirePermission('content.manage');
  const rows = await listAchievementsAdmin();

  return (
    <>
      <PortalHeader
        title="Prestasi"
        back={{ href: '/dashboard/konten', label: 'Konten situs' }}
        description="Capaian gudep dan peserta yang tampil di halaman Prestasi."
        actions={
          <ButtonLink href="/dashboard/konten/prestasi/baru">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tambah prestasi
          </ButtonLink>
        }
      />
      {searchParams.tersimpan && <Notice>Prestasi tersimpan.</Notice>}
      {searchParams.dihapus && <Notice>Prestasi dihapus.</Notice>}

      <Panel>
        {rows.length === 0 ? (
          <EmptyState icon={Award} title="Belum ada prestasi" description="Catat capaian pertama untuk ditampilkan di situs." />
        ) : (
          <TableWrap label="Daftar prestasi">
            <table className="w-full min-w-[40rem] text-base">
              <caption className="sr-only">Daftar prestasi, tahun terbaru di atas</caption>
              <thead className="border-b border-border-subtle">
                <tr>
                  <th scope="col" className={th}>
                    Prestasi
                  </th>
                  <th scope="col" className={th}>
                    Tingkat
                  </th>
                  <th scope="col" className={th}>
                    Tahun
                  </th>
                  <th scope="col" className={th}>
                    Status
                  </th>
                  <th scope="col" className={th}>
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td className={td}>
                      <Link href={`/dashboard/konten/prestasi/${a.id}`} className="font-semibold text-text-primary hover:underline">
                        {a.title}
                      </Link>
                      <p className="text-sm text-text-secondary">{a.recipient}</p>
                    </td>
                    <td className={td}>{a.level}</td>
                    <td className={td}>{a.year}</td>
                    <td className={td}>
                      <PublishBadge published={a.published} draftLabel="Disembunyikan" />
                    </td>
                    <td className={td}>
                      <ActionButton
                        action={deleteAchievementAction.bind(null, a.id)}
                        variant="ghost"
                        confirm={`Hapus prestasi "${a.title}"?`}
                        label={`Hapus prestasi ${a.title}`}
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
