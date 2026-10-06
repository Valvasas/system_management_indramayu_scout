import type { Metadata } from 'next';
import Link from 'next/link';
import { Newspaper, Plus, Trash2 } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionButton } from '@/components/dashboard/ConfirmButton';
import { Notice, Panel, PortalHeader, PublishBadge, TableWrap, td, th } from '@/components/dashboard/ui';
import { deleteNewsAction } from '@/features/content/news';
import { listNewsAdmin } from '@/features/content/queries';
import { requirePermission } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Berita' };

const STATUS_LABEL = { PUBLISHED: 'Tayang', DRAFT: 'Draf', REVIEW: 'Menunggu review', ARCHIVED: 'Arsip' } as const;

export default async function BeritaAdminPage({
  searchParams = {},
}: {
  searchParams?: { tersimpan?: string; dihapus?: string; dikembalikan?: string };
}) {
  await requirePermission('content.manage');
  // Antrean review selalu di atas: itu pekerjaan yang menunggu editor.
  const rows = (await listNewsAdmin()).sort((a, b) => Number(b.status === 'REVIEW') - Number(a.status === 'REVIEW'));
  const inReview = rows.filter((r) => r.status === 'REVIEW').length;

  return (
    <>
      <PortalHeader
        title="Berita"
        back={{ href: '/dashboard/konten', label: 'Konten situs' }}
        description="Hanya berita berstatus Tayang yang muncul di situs publik."
        actions={
          <ButtonLink href="/dashboard/konten/berita/baru">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tulis berita
          </ButtonLink>
        }
      />
      {searchParams.tersimpan && <Notice>Berita tersimpan.</Notice>}
      {searchParams.dihapus && <Notice>Berita dihapus.</Notice>}
      {searchParams.dikembalikan && <Notice>Berita dikembalikan ke penulis beserta catatan Anda.</Notice>}
      {inReview > 0 && <Notice tone="info">{inReview} berita dari kontributor menunggu review Anda.</Notice>}

      <Panel>
        {rows.length === 0 ? (
          <EmptyState
            icon={Newspaper}
            title="Belum ada berita"
            description="Tulis berita pertama. Simpan sebagai draf bila belum siap tayang."
          />
        ) : (
          <TableWrap label="Daftar berita">
            <table className="w-full min-w-[40rem] text-base">
              <caption className="sr-only">Daftar berita, terbaru diubah di atas</caption>
              <thead className="border-b border-border-subtle">
                <tr>
                  <th scope="col" className={th}>
                    Judul
                  </th>
                  <th scope="col" className={th}>
                    Kategori
                  </th>
                  <th scope="col" className={th}>
                    Status
                  </th>
                  <th scope="col" className={th}>
                    Diubah
                  </th>
                  <th scope="col" className={th}>
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {rows.map((n) => (
                  <tr key={n.id}>
                    <td className={td}>
                      <Link href={`/dashboard/konten/berita/${n.id}`} className="font-semibold text-text-primary hover:underline">
                        {n.title}
                      </Link>
                    </td>
                    <td className={td}>{n.category}</td>
                    <td className={td}>
                      <PublishBadge published={n.status === 'PUBLISHED'} draftLabel={STATUS_LABEL[n.status]} />
                    </td>
                    <td className={td}>{formatDate(n.updatedAt.toISOString())}</td>
                    <td className={td}>
                      <ActionButton
                        action={deleteNewsAction.bind(null, n.id)}
                        variant="ghost"
                        confirm={`Hapus berita "${n.title}"? Tindakan ini tidak dapat dibatalkan.`}
                        label={`Hapus berita ${n.title}`}
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
