import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NewsForm, ReturnNewsForm } from '@/components/dashboard/content/ContentForms';
import { Notice, Panel, PortalHeader } from '@/components/dashboard/ui';
import { returnNewsAction, saveNewsAction } from '@/features/content/news';
import { asId, getNewsAdmin } from '@/features/content/queries';
import { requirePermission } from '@/lib/auth/session';
import { NEWS_CATEGORIES } from '@/lib/domain';

export const metadata: Metadata = { title: 'Ubah berita' };

export default async function BeritaEditorPage({ params }: { params: { id: string } }) {
  const user = await requirePermission('content.manage');
  const isNew = params.id === 'baru';
  const id = isNew ? null : asId(params.id);
  if (!isNew && !id) notFound();
  const row = id ? await getNewsAdmin(id) : null;
  if (id && !row) notFound();

  return (
    <>
      <PortalHeader title={row ? 'Ubah berita' : 'Tulis berita'} back={{ href: '/dashboard/konten/berita', label: 'Daftar berita' }} />
      {row?.status === 'REVIEW' && (
        <div className="mb-6 grid max-w-3xl gap-4">
          <Notice tone="info">Berita ini dikirim kontributor dan menunggu review. Untuk menerbitkan, ubah status menjadi Tayang lalu simpan.</Notice>
          <Panel title="Atau kembalikan ke penulis">
            <ReturnNewsForm action={returnNewsAction.bind(null, row.id)} />
          </Panel>
        </div>
      )}
      <div className="max-w-3xl">
        <NewsForm
          action={saveNewsAction.bind(null, id)}
          categories={NEWS_CATEGORIES}
          defaultAuthor={user.name}
          defaults={
            row
              ? {
                  title: row.title,
                  category: row.category,
                  excerpt: row.excerpt,
                  content: row.content,
                  author: row.author,
                  tags: row.tags,
                  status: row.status,
                  publishedAt: row.publishedAt ? row.publishedAt.toISOString().slice(0, 10) : '',
                  hasCover: Boolean(row.coverImage),
                }
              : undefined
          }
        />
      </div>
    </>
  );
}
