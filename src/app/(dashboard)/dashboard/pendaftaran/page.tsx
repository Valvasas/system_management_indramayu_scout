import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays, ChevronRight, Users } from 'lucide-react';
import { Panel, PortalHeader } from '@/components/dashboard/ui';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { eventsWithRegistrations } from '@/features/portal/registrations';
import { scopeLevel } from '@/lib/auth/scope';
import { requirePermission } from '@/lib/auth/session';
import { formatDate, formatDayMonth } from '@/lib/format';

export const metadata: Metadata = { title: 'Pendaftaran kegiatan' };

export default async function PendaftaranPage() {
  const user = await requirePermission('members.read');
  const events = await eventsWithRegistrations(user);
  const wide = scopeLevel(user) === 'KABUPATEN';
  const now = Date.now();

  return (
    <>
      <PortalHeader
        title="Pendaftaran kegiatan"
        description={
          wide
            ? 'Rekap peserta yang mendaftar lewat portal, seluruh kabupaten.'
            : 'Rekap anggota di wilayah Anda yang mendaftar kegiatan lewat portal.'
        }
      />
      <Panel>
        {events.length === 0 ? (
          <EmptyState
            variant="icon"
            icon={CalendarDays}
            title="Belum ada kegiatan"
            description="Kegiatan yang tayang akan muncul di sini beserta jumlah pendaftarnya."
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {events.map((e) => {
              const d = formatDayMonth(e.dateStart.toISOString());
              const past = e.dateStart.getTime() < now;
              return (
                <li key={e.id}>
                  <Link
                    href={`/dashboard/pendaftaran/${e.id}`}
                    className="group flex items-center gap-4 rounded-xl py-4 hover:bg-surface-subtle sm:px-2"
                  >
                    <span className="flex w-14 shrink-0 flex-col items-center rounded-xl border border-border-subtle bg-surface-base py-1 text-center">
                      <span className="text-[0.7rem] font-bold uppercase text-text-warm">{d.month}</span>
                      <span className="font-display text-xl font-semibold leading-none text-text-primary">{d.day}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-text-primary group-hover:text-text-accent">{e.title}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                        {formatDate(e.dateStart.toISOString())} · {e.location}
                        {e.registrationOpen && !past && (
                          <Badge tone="success" icon={CalendarDays}>
                            Pendaftaran dibuka
                          </Badge>
                        )}
                        {past && <Badge tone="neutral">Sudah lewat</Badge>}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 rounded-pill bg-surface-meadow px-3 py-1.5 text-sm font-semibold text-action-secondary-text">
                      <Users className="h-4 w-4" aria-hidden="true" />
                      <span className="tabular-nums">{e.registrants}</span>
                      <span className="sr-only">pendaftar</span>
                    </span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-text-muted" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
