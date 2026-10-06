import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AchievementForm } from '@/components/dashboard/content/ContentForms';
import { PortalHeader } from '@/components/dashboard/ui';
import { saveAchievementAction } from '@/features/content/organization';
import { asId, getAchievementAdmin } from '@/features/content/queries';
import { requirePermission } from '@/lib/auth/session';
import { ACHIEVEMENT_LEVEL_OPTIONS } from '@/lib/domain';

export const metadata: Metadata = { title: 'Ubah prestasi' };

export default async function PrestasiEditorPage({ params }: { params: { id: string } }) {
  await requirePermission('content.manage');
  const isNew = params.id === 'baru';
  const id = isNew ? null : asId(params.id);
  if (!isNew && !id) notFound();
  const row = id ? await getAchievementAdmin(id) : null;
  if (id && !row) notFound();

  return (
    <>
      <PortalHeader
        title={row ? 'Ubah prestasi' : 'Tambah prestasi'}
        back={{ href: '/dashboard/konten/prestasi', label: 'Daftar prestasi' }}
      />
      <div className="max-w-3xl">
        <AchievementForm
          action={saveAchievementAction.bind(null, id)}
          levels={ACHIEVEMENT_LEVEL_OPTIONS}
          defaults={
            row
              ? {
                  title: row.title,
                  level: row.level,
                  year: row.year,
                  recipient: row.recipient,
                  description: row.description,
                  published: row.published,
                }
              : undefined
          }
        />
      </div>
    </>
  );
}
