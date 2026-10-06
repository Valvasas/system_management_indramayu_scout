import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NewsForm } from '@/components/dashboard/content/ContentForms';
import { Notice, PortalHeader } from '@/components/dashboard/ui';
import { saveContributionAction } from '@/features/content/contributions';
import { asId, getNewsAdmin } from '@/features/content/queries';
import { requirePermission } from '@/lib/auth/session';
import { NEWS_CATEGORIES } from '@/lib/domain';

export const metadata: Metadata = { title: 'Tulis berita' };

export default async function KontribusiEditorPage({ params }: { params: { id: string } }) {
  const user = await requirePermission('content.contribute');
  const isNew = params.id === 'baru';
  const id = isNew ? null : asId(params.id);
  if (!isNew && !id) notFound();
  const row = id ? await getNewsAdmin(id) : null;
  // Hanya berita milik sendiri yang belum terbit.
  if (id && (!row || row.createdById !== user.id || (row.status !== 'DRAFT' && row.status !== 'REVIEW'))) notFound();

  return (
    <>
      <PortalHeader title={row ? 'Ubah tulisan' : 'Tulis berita'} back={{ href: '/dashboard/kontribusi', label: 'Tulisan saya' }} />
      {row?.reviewNote && <Notice tone="warning">Catatan editor: {row.reviewNote}</Notice>}
      <div className="max-w-3xl">
        <NewsForm
          mode="contributor"
          action={saveContributionAction.bind(null, id)}
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
                  hasCover: Boolean(row.coverImage),
                }
              : undefined
          }
        />
      </div>
    </>
  );
}
