import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionButton } from '@/components/dashboard/ConfirmButton';
import { Notice, Panel, PortalHeader, PublishBadge, TableWrap, td, th } from '@/components/dashboard/ui';
import { deleteDocumentAction } from '@/features/content/documents';
import { listDocumentsAdmin } from '@/features/content/queries';
import { requirePermission } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { formatBytes } from '@/lib/storage';

export const metadata: Metadata = { title: 'Dokumen' };

export default async function DokumenAdminPage({ searchParams = {} }: { searchParams?: { tersimpan?: string; dihapus?: string } }) {
  await requirePermission('content.manage');
  const rows = await listDocumentsAdmin();

  return (
    <>
      <PortalHeader
        title="Dokumen"
        back={{ href: '/dashboard/konten', label: 'Konten situs' }}
        description="Unggah berkas resmi. Dokumen tanpa berkas tidak bisa ditayangkan."
        actions={
          <ButtonLink href="/dashboard/konten/dokumen/baru">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tambah dokumen
          </ButtonLink>
        }
      />
      {searchParams.tersimpan && <Notice>Dokumen tersimpan.</Notice>}
      {searchParams.dihapus && <Notice>Dokumen dihapus.</Notice>}

      <Panel>
        {rows.length === 0 ? (
          <EmptyState icon={FileText} title="Belum ada dokumen" description="Unggah SK, formulir, atau panduan agar bisa diunduh publik." />
        ) : (
          <TableWrap label="Daftar dokumen">
            <table className="w-full min-w-[44rem] text-base">
              <caption className="sr-only">Daftar dokumen</caption>
              <thead className="border-b border-border-subtle">
                <tr>
                  <th scope="col" className={th}>
                    Dokumen
                  </th>
                  <th scope="col" className={th}>
                    Kategori
                  </th>
                  <th scope="col" className={th}>
                    Berkas
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
                {rows.map((d) => (
                  <tr key={d.id}>
                    <td className={td}>
                      <Link href={`/dashboard/konten/dokumen/${d.id}`} className="font-semibold text-text-primary hover:underline">
                        {d.title}
                      </Link>
                      <p className="text-sm text-text-secondary">{formatDate(d.date)}</p>
                    </td>
                    <td className={td}>{d.category}</td>
                    <td className={td}>
                      {d.fileUrl ? `${d.fileType} · ${formatBytes(d.fileSize)}` : <span className="text-text-muted">Belum diunggah</span>}
                    </td>
                    <td className={td}>
                      <PublishBadge published={d.published} />
                    </td>
                    <td className={td}>
                      <ActionButton
                        action={deleteDocumentAction.bind(null, d.id)}
                        variant="ghost"
                        confirm={`Hapus dokumen "${d.title}" beserta berkasnya?`}
                        label={`Hapus dokumen ${d.title}`}
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
