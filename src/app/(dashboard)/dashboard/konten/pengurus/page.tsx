import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus, Trash2, Users } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionButton } from '@/components/dashboard/ConfirmButton';
import { Notice, Panel, PortalHeader, TableWrap, td, th } from '@/components/dashboard/ui';
import { deleteBoardMemberAction } from '@/features/content/organization';
import { listBoardAdmin } from '@/features/content/queries';
import { requirePermission } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Pengurus' };

export default async function PengurusAdminPage({ searchParams = {} }: { searchParams?: { tersimpan?: string; dihapus?: string } }) {
  await requirePermission('content.manage');
  const rows = await listBoardAdmin();

  return (
    <>
      <PortalHeader
        title="Pengurus"
        back={{ href: '/dashboard/konten', label: 'Konten situs' }}
        description="Tampil di halaman Struktur Organisasi, dikelompokkan per bidang dan diurutkan menurut angka urutan."
        actions={
          <ButtonLink href="/dashboard/konten/pengurus/baru">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tambah pengurus
          </ButtonLink>
        }
      />
      {searchParams.tersimpan && <Notice>Data pengurus tersimpan.</Notice>}
      {searchParams.dihapus && <Notice>Data pengurus dihapus.</Notice>}

      <Panel>
        {rows.length === 0 ? (
          <EmptyState icon={Users} title="Belum ada pengurus" description="Tambahkan susunan pengurus agar tampil di situs publik." />
        ) : (
          <TableWrap label="Daftar pengurus">
            <table className="w-full min-w-[40rem] text-base">
              <caption className="sr-only">Daftar pengurus Kwarcab</caption>
              <thead className="border-b border-border-subtle">
                <tr>
                  <th scope="col" className={th}>
                    Nama
                  </th>
                  <th scope="col" className={th}>
                    Jabatan
                  </th>
                  <th scope="col" className={th}>
                    Bidang
                  </th>
                  <th scope="col" className={th}>
                    Masa bakti
                  </th>
                  <th scope="col" className={th}>
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {rows.map((b) => (
                  <tr key={b.id}>
                    <td className={td}>
                      <Link href={`/dashboard/konten/pengurus/${b.id}`} className="font-semibold text-text-primary hover:underline">
                        {b.name}
                      </Link>
                    </td>
                    <td className={td}>{b.position}</td>
                    <td className={td}>{b.department}</td>
                    <td className={td}>{b.period}</td>
                    <td className={td}>
                      <ActionButton
                        action={deleteBoardMemberAction.bind(null, b.id)}
                        variant="ghost"
                        confirm={`Hapus ${b.name} dari daftar pengurus?`}
                        label={`Hapus pengurus ${b.name}`}
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
