import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EventForm } from '@/components/dashboard/content/ContentForms';
import { PortalHeader } from '@/components/dashboard/ui';
import { saveEventAction } from '@/features/content/events';
import { asId, getEventAdmin } from '@/features/content/queries';
import { toLocalDateTime } from '@/features/content/shared';
import { requirePermission } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Ubah agenda' };

export default async function AgendaEditorPage({ params }: { params: { id: string } }) {
  await requirePermission('content.manage');
  const isNew = params.id === 'baru';
  const id = isNew ? null : asId(params.id);
  if (!isNew && !id) notFound();
  const row = id ? await getEventAdmin(id) : null;
  if (id && !row) notFound();

  return (
    <>
      <PortalHeader title={row ? 'Ubah agenda' : 'Tambah agenda'} back={{ href: '/dashboard/konten/agenda', label: 'Daftar agenda' }} />
      <div className="max-w-3xl">
        <EventForm
          action={saveEventAction.bind(null, id)}
          defaults={
            row
              ? {
                  title: row.title,
                  dateStart: toLocalDateTime(row.dateStart),
                  dateEnd: toLocalDateTime(row.dateEnd),
                  location: row.location,
                  organizer: row.organizer,
                  description: row.description,
                  contactPerson: row.contactPerson,
                  published: row.published,
                  cancelled: row.cancelled,
                  registrationOpen: row.registrationOpen,
                }
              : undefined
          }
        />
      </div>
    </>
  );
}
