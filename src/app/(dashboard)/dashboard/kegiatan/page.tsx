import type { Metadata } from 'next';
import { AlertCircle, BadgeCheck, CalendarX2, Clock, MapPin, UserRound } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionButton } from '@/components/dashboard/ConfirmButton';
import { Notice, Panel, PortalHeader } from '@/components/dashboard/ui';
import { cancelRegistrationAction, registerEventAction } from '@/features/portal/actions';
import { getOwnMember, upcomingEventsFor } from '@/features/portal/peserta';
import { requirePermission } from '@/lib/auth/session';
import { formatDate, formatTime } from '@/lib/format';

export const metadata: Metadata = { title: 'Kegiatan' };

type Search = { daftar?: string; batal?: string; gagal?: string };

const FAIL_MESSAGES: Record<string, string> = {
  status: 'Pendaftaran hanya untuk anggota berstatus Aktif. Hubungi pembina gudep bila data Anda belum diverifikasi.',
  tutup: 'Pendaftaran kegiatan ini sudah ditutup atau kegiatan telah dimulai.',
  lewat: 'Pendaftaran tidak dapat dibatalkan karena kegiatan sudah dimulai.',
};

export default async function KegiatanPage({ searchParams = {} }: { searchParams?: Search }) {
  const user = await requirePermission('self.portal');
  const [own, events] = await Promise.all([getOwnMember(user), upcomingEventsFor(user)]);
  const canRegister = own?.m.status === 'ACTIVE';
  const failMessage = searchParams.gagal ? FAIL_MESSAGES[searchParams.gagal] : undefined;

  return (
    <>
      <PortalHeader title="Kegiatan" description="Kegiatan mendatang Kwarcab Indramayu. Daftar di sini bila pendaftarannya dibuka." />
      {searchParams.daftar && <Notice>Pendaftaran berhasil. Kegiatan ini sekarang muncul di Ringkasan Anda.</Notice>}
      {searchParams.batal && <Notice>Pendaftaran dibatalkan.</Notice>}
      {failMessage && <Notice tone="warning">{failMessage}</Notice>}
      {own && !canRegister && !failMessage && (
        <Notice tone="info">Data keanggotaan Anda belum berstatus Aktif, sehingga belum dapat mendaftar kegiatan.</Notice>
      )}

      {events.length === 0 ? (
        <Panel>
          <EmptyState icon={CalendarX2} title="Belum ada kegiatan mendatang" description="Kegiatan baru akan muncul di sini setelah dijadwalkan oleh pengurus." />
        </Panel>
      ) : (
        <ul className="space-y-4">
          {events.map((e) => (
            <li key={e.id}>
              <Panel>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg font-semibold text-text-primary">{e.title}</h2>
                      {e.registered && (
                        <Badge tone="success" icon={BadgeCheck}>
                          Terdaftar
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-text-secondary">
                      <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {formatDate(e.dateStart.toISOString())}, {formatTime(e.dateStart.toISOString())}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
                      <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {e.location}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
                      <UserRound className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {e.organizer}
                      {e.contactPerson ? ` · ${e.contactPerson}` : ''}
                    </p>
                    <p className="mt-3 line-clamp-3 max-w-prose whitespace-pre-line text-text-secondary">{e.description}</p>
                  </div>

                  <div className="shrink-0">
                    {e.registered ? (
                      <ActionButton action={cancelRegistrationAction.bind(null, e.id)} variant="outline" size="md" confirm={`Batalkan pendaftaran "${e.title}"?`} label={`Batalkan pendaftaran ${e.title}`}>
                        Batalkan pendaftaran
                      </ActionButton>
                    ) : e.registrationOpen ? (
                      canRegister ? (
                        <ActionButton action={registerEventAction.bind(null, e.id)} variant="secondary" size="md" label={`Daftar kegiatan ${e.title}`}>
                          Daftar kegiatan
                        </ActionButton>
                      ) : (
                        <p className="flex items-center gap-1.5 text-sm text-text-secondary">
                          <AlertCircle className="h-4 w-4" aria-hidden="true" />
                          Menunggu data Aktif
                        </p>
                      )
                    ) : (
                      <p className="text-sm text-text-muted">Pendaftaran tidak dibuka</p>
                    )}
                  </div>
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
