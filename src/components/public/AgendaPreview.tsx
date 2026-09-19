import React from 'react';
import Link from 'next/link';
import { CalendarDays, CalendarX2, MapPin } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { AgendaStatusBadge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { Section } from '../ui/Section';
import { getUpcomingAgenda } from '@/lib/repositories';
import { formatDateRange } from '@/lib/format';

export const AgendaPreview = async () => {
  const agendas = await getUpcomingAgenda(3);

  return (
    <Section
      id="agenda"
      title="Agenda kegiatan"
      description="Jadwal resmi kegiatan kwartir cabang dan ranting terdekat."
      surface="subtle"
      emphasis="primary"
      action={{ label: 'Semua agenda', href: '/agenda' }}
    >
      {agendas.length === 0 ? (
        <EmptyState
          icon={CalendarX2}
          title="Belum ada agenda terjadwal"
          description="Jadwal kegiatan berikutnya akan diumumkan melalui kwartir ranting dan halaman ini."
          action={{ label: 'Lihat arsip agenda', href: '/agenda' }}
        />
      ) : (
        <ul className="grid gap-6 md:grid-cols-3">
          {agendas.map((agenda) => (
            <li key={agenda.id}>
              <Card hoverable className="relative h-full">
                <CardContent className="flex h-full flex-col">
                  <AgendaStatusBadge status={agenda.status} className="self-start" />
                  <h3 className="mt-4 font-display text-lg font-bold leading-snug text-text-primary">
                    <Link
                      href={`/agenda/${agenda.slug}`}
                      className="stretched-link rounded-md hover:text-text-accent"
                    >
                      {agenda.title}
                    </Link>
                  </h3>
                  <dl className="mt-4 space-y-2 text-sm text-text-secondary">
                    <div className="flex items-start gap-2">
                      <dt>
                        <CalendarDays className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="sr-only">Tanggal</span>
                      </dt>
                      <dd>{formatDateRange(agenda.dateStart, agenda.dateEnd)}</dd>
                    </div>
                    <div className="flex items-start gap-2">
                      <dt>
                        <MapPin className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="sr-only">Lokasi</span>
                      </dt>
                      <dd>{agenda.location}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
};
