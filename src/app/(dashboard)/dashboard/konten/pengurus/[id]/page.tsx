import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BoardForm } from '@/components/dashboard/content/ContentForms';
import { PortalHeader } from '@/components/dashboard/ui';
import { saveBoardMemberAction } from '@/features/content/organization';
import { asId, getBoardAdmin } from '@/features/content/queries';
import { requirePermission } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Ubah pengurus' };

export default async function PengurusEditorPage({ params }: { params: { id: string } }) {
  await requirePermission('content.manage');
  const isNew = params.id === 'baru';
  const id = isNew ? null : asId(params.id);
  if (!isNew && !id) notFound();
  const row = id ? await getBoardAdmin(id) : null;
  if (id && !row) notFound();

  return (
    <>
      <PortalHeader
        title={row ? 'Ubah pengurus' : 'Tambah pengurus'}
        back={{ href: '/dashboard/konten/pengurus', label: 'Daftar pengurus' }}
      />
      <div className="max-w-3xl">
        <BoardForm
          action={saveBoardMemberAction.bind(null, id)}
          defaults={
            row
              ? { name: row.name, position: row.position, department: row.department, period: row.period, sortOrder: row.sortOrder }
              : undefined
          }
        />
      </div>
    </>
  );
}
