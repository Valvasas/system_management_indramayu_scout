import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DocumentForm } from '@/components/dashboard/content/ContentForms';
import { PortalHeader } from '@/components/dashboard/ui';
import { saveDocumentAction } from '@/features/content/documents';
import { asId, getDocumentAdmin } from '@/features/content/queries';
import { requirePermission } from '@/lib/auth/session';
import { DOCUMENT_CATEGORIES } from '@/lib/domain';

export const metadata: Metadata = { title: 'Ubah dokumen' };

export default async function DokumenEditorPage({ params }: { params: { id: string } }) {
  await requirePermission('content.manage');
  const isNew = params.id === 'baru';
  const id = isNew ? null : asId(params.id);
  if (!isNew && !id) notFound();
  const row = id ? await getDocumentAdmin(id) : null;
  if (id && !row) notFound();

  return (
    <>
      <PortalHeader title={row ? 'Ubah dokumen' : 'Tambah dokumen'} back={{ href: '/dashboard/konten/dokumen', label: 'Daftar dokumen' }} />
      <div className="max-w-3xl">
        <DocumentForm
          action={saveDocumentAction.bind(null, id)}
          categories={DOCUMENT_CATEGORIES}
          defaults={
            row
              ? {
                  title: row.title,
                  category: row.category,
                  description: row.description,
                  date: row.date,
                  published: row.published,
                  fileName: row.fileUrl ? row.fileUrl.split('/').pop() : null,
                }
              : undefined
          }
        />
      </div>
    </>
  );
}
