import type { Metadata } from 'next';
import { BellOff, CheckCheck, ShieldAlert } from 'lucide-react';
import { ActionButton } from '@/components/dashboard/ConfirmButton';
import { NotificationList } from '@/components/dashboard/notifications/NotificationList';
import { Notice, Pagination, Panel, PortalHeader, withQuery } from '@/components/dashboard/ui';
import { ActionForm, SubmitButton } from '@/components/forms/ActionForm';
import { CheckboxField } from '@/components/forms/Fields';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChips } from '@/components/ui/FilterChips';
import { markAllReadAction, savePreferencesAction } from '@/features/notifications/actions';
import { InboxQuerySchema, inboxPage } from '@/features/notifications/inbox';
import { NOTIFICATION_KIND_LABELS, alwaysOnKindsFor, preferenceKindsFor } from '@/features/notifications/labels';
import { preferencesOf } from '@/features/notifications/notify';
import { requireUser } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Notifikasi' };

type Search = { halaman?: string; tampil?: string; dibaca?: string; 'semua-dibaca'?: string; 'tidak-ditemukan'?: string };

export default async function NotifikasiPage({ searchParams = {} }: { searchParams?: Search }) {
  // Semua pengguna portal (staf & peserta). Data selalu dibatasi ke pemilik sesi ini.
  const user = await requireUser();
  const q = InboxQuerySchema.parse(searchParams);
  const [inbox, prefs] = await Promise.all([inboxPage(user.id, { page: q.halaman, filter: q.tampil }), preferencesOf(user.id)]);
  const kinds = preferenceKindsFor(user.role);
  const alwaysOn = alwaysOnKindsFor(user.role);
  const current = { tampil: q.tampil === 'semua' ? undefined : q.tampil };

  return (
    <>
      <PortalHeader
        title="Notifikasi"
        description="Kabar terbaru yang perlu Anda ketahui. Hanya Anda yang dapat melihat notifikasi ini; rinciannya ada di halaman tujuan masing-masing."
        actions={
          inbox.unread > 0 ? (
            <ActionButton action={markAllReadAction} size="md">
              <CheckCheck className="h-4 w-4" aria-hidden="true" />
              Tandai semua dibaca
            </ActionButton>
          ) : undefined
        }
      />
      {searchParams['semua-dibaca'] && <Notice>Semua notifikasi sudah ditandai dibaca.</Notice>}
      {searchParams.dibaca && <Notice>Notifikasi ditandai dibaca.</Notice>}
      {searchParams['tidak-ditemukan'] && <Notice tone="warning">Notifikasi tidak ditemukan.</Notice>}

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          id="kotak-masuk"
          title="Kotak masuk"
          description={inbox.unread > 0 ? `${inbox.unread.toLocaleString('id-ID')} belum dibaca` : 'Semua sudah dibaca'}
          className="min-w-0 lg:col-span-2"
          bodyClassName="p-0 sm:p-0"
        >
          <div className="border-b border-border-subtle px-5 py-4 sm:px-6">
            <FilterChips
              label="Saring notifikasi"
              param="tampil"
              active={q.tampil}
              options={[
                { value: 'semua', label: 'Semua' },
                { value: 'belum', label: 'Belum dibaca' },
              ]}
            />
          </div>
          {inbox.items.length === 0 ? (
            <div className="p-5 sm:p-6">
              <EmptyState
                variant="icon"
                icon={BellOff}
                title={q.tampil === 'belum' ? 'Tidak ada yang belum dibaca' : 'Belum ada notifikasi'}
                description={
                  q.tampil === 'belum'
                    ? 'Semua notifikasi Anda sudah dibaca.'
                    : 'Kabar tentang tugas dan kegiatan Anda akan muncul di sini.'
                }
                action={q.tampil === 'belum' ? { label: 'Lihat semua notifikasi', href: '/dashboard/notifikasi' } : undefined}
              />
            </div>
          ) : (
            <NotificationList items={inbox.items} page={inbox.page} filter={q.tampil} />
          )}
          <div className="border-t border-border-subtle px-5 pb-4 sm:px-6">
            <Pagination
              page={inbox.page}
              pageCount={inbox.pageCount}
              total={inbox.total}
              unit="notifikasi"
              hrefFor={(p) => withQuery('/dashboard/notifikasi', current, { halaman: p > 1 ? p : undefined })}
            />
          </div>
        </Panel>

        <Panel
          id="preferensi"
          title="Preferensi"
          description="Pilih jenis notifikasi yang ingin Anda terima."
          className="min-w-0 self-start"
        >
          <ActionForm action={savePreferencesAction} aria-label="Preferensi notifikasi">
            <fieldset className="space-y-4">
              <legend className="sr-only">Jenis notifikasi yang diterima</legend>
              {kinds.map((kind) => (
                <CheckboxField
                  key={kind}
                  name={kind}
                  label={NOTIFICATION_KIND_LABELS[kind].label}
                  description={NOTIFICATION_KIND_LABELS[kind].description}
                  defaultChecked={prefs[kind] !== false}
                />
              ))}
            </fieldset>
            <p className="flex items-start gap-2 rounded-lg bg-surface-subtle px-3 py-2.5 text-sm text-text-secondary">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                Notifikasi berprioritas tinggi selalu dikirim walaupun jenisnya Anda matikan
                {alwaysOn.length > 0
                  ? `, termasuk ${alwaysOn.map((k) => NOTIFICATION_KIND_LABELS[k].label.toLowerCase()).join(', ')} yang tidak dapat dimatikan`
                  : ''}
                .
              </span>
            </p>
            <SubmitButton>Simpan preferensi</SubmitButton>
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
