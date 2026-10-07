import type { Metadata } from 'next';
import { Megaphone, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { AnnouncementForm } from '@/components/dashboard/AnnouncementForm';
import { ActionButton } from '@/components/dashboard/ConfirmButton';
import { Notice, Panel, PortalHeader } from '@/components/dashboard/ui';
import { createAnnouncementAction, deleteAnnouncementAction } from '@/features/announcements/actions';
import { canTargetWholeKwarcab, managedAnnouncements } from '@/features/announcements/queries';
import { gudepOptions } from '@/features/members/queries';
import { requirePermission } from '@/lib/auth/session';
import { AUDIENCE_LABELS } from '@/lib/domain';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Pengumuman' };

export default async function PengumumanPage({ searchParams }: { searchParams?: { tersimpan?: string; dihapus?: string } }) {
  const user = await requirePermission('announcements.manage');
  const whole = canTargetWholeKwarcab(user);
  const [list, gudeps] = await Promise.all([
    managedAnnouncements(user),
    user.role === 'STAFF_GUDEP' ? Promise.resolve(null) : gudepOptions(user),
  ]);

  return (
    <>
      <PortalHeader title="Pengumuman" description="Pesan singkat untuk peserta dan/atau staf. Tampil di halaman Ringkasan penerima." />
      {searchParams?.tersimpan && <Notice>Pengumuman diterbitkan.</Notice>}
      {searchParams?.dihapus && <Notice>Pengumuman dihapus.</Notice>}

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title="Buat pengumuman" className="lg:col-span-2">
          <AnnouncementForm
            action={createAnnouncementAction}
            audienceOptions={Object.entries(AUDIENCE_LABELS).map(([value, label]) => ({ value, label }))}
            gudepOptions={gudeps ? gudeps.map((g) => ({ value: g.id, label: g.name })) : null}
            allowWholeKwarcab={whole}
          />
        </Panel>

        <Panel title="Sudah diterbitkan" className="lg:col-span-3">
          {list.length === 0 ? (
            <EmptyState icon={Megaphone} title="Belum ada pengumuman" description="Pengumuman yang Anda terbitkan akan tampil di sini." />
          ) : (
            <ul className="divide-y divide-border-subtle">
              {list.map(({ a, gudepName }) => (
                <li key={a.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-text-primary">{a.title}</p>
                    <p className="mt-1 whitespace-pre-line text-text-secondary">{a.body}</p>
                    <p className="mt-1 text-sm text-text-muted">
                      {AUDIENCE_LABELS[a.audience]} · {gudepName ?? 'Seluruh Kwarcab'} · {a.authorName} ·{' '}
                      {formatDate(a.createdAt.toISOString())}
                    </p>
                  </div>
                  <ActionButton
                    action={deleteAnnouncementAction.bind(null, a.id)}
                    variant="ghost"
                    confirm={`Hapus pengumuman "${a.title}"?`}
                    label={`Hapus pengumuman ${a.title}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Hapus
                  </ActionButton>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
