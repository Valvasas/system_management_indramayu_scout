import type { Metadata } from 'next';
import Link from 'next/link';
import { Images, Plus, Trash2 } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionButton } from '@/components/dashboard/ConfirmButton';
import { Notice, Panel, PortalHeader, PublishBadge, TableWrap, td, th } from '@/components/dashboard/ui';
import { deleteAlbumAction } from '@/features/content/gallery';
import { listAlbumsAdmin } from '@/features/content/queries';
import { requirePermission } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Galeri' };

export default async function GaleriAdminPage({ searchParams = {} }: { searchParams?: { dihapus?: string } }) {
  await requirePermission('content.manage');
  const rows = await listAlbumsAdmin();

  return (
    <>
      <PortalHeader
        title="Galeri"
        back={{ href: '/dashboard/konten', label: 'Konten situs' }}
        description="Album dokumentasi kegiatan. Buat album dulu, lalu unggah fotonya."
        actions={
          <ButtonLink href="/dashboard/konten/galeri/baru">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Buat album
          </ButtonLink>
        }
      />
      {searchParams.dihapus && <Notice>Album dan seluruh fotonya dihapus.</Notice>}

      <Panel>
        {rows.length === 0 ? (
          <EmptyState icon={Images} title="Belum ada album" description="Buat album pertama untuk dokumentasi kegiatan." />
        ) : (
          <TableWrap label="Daftar album">
            <table className="w-full min-w-[40rem] text-base">
              <caption className="sr-only">Daftar album foto, kegiatan terbaru di atas</caption>
              <thead className="border-b border-border-subtle">
                <tr>
                  <th scope="col" className={th}>
                    Album
                  </th>
                  <th scope="col" className={th}>
                    Tanggal
                  </th>
                  <th scope="col" className={th}>
                    Foto
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
                {rows.map(({ album, photoCount }) => (
                  <tr key={album.id}>
                    <td className={td}>
                      <Link href={`/dashboard/konten/galeri/${album.id}`} className="font-semibold text-text-primary hover:underline">
                        {album.title}
                      </Link>
                      <p className="text-sm text-text-secondary">{album.category}</p>
                    </td>
                    <td className={td}>{formatDate(album.date)}</td>
                    <td className={td}>{photoCount}</td>
                    <td className={td}>
                      <PublishBadge published={album.published} />
                    </td>
                    <td className={td}>
                      <ActionButton
                        action={deleteAlbumAction.bind(null, album.id)}
                        variant="ghost"
                        confirm={`Hapus album "${album.title}" beserta ${photoCount} fotonya? Tidak dapat dibatalkan.`}
                        label={`Hapus album ${album.title}`}
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
