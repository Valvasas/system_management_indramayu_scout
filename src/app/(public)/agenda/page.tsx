import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays, CalendarX2, MapPin, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { AgendaStatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChips } from '@/components/ui/FilterChips';
import { PageHeader } from '@/components/ui/Section';
import { getAgenda, isAgendaStatus } from '@/lib/repositories';
import { formatDateRange } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Agenda Kegiatan',
  description:
    'Jadwal resmi kegiatan, perlombaan, pelatihan, dan upacara kepramukaan Kwartir Cabang Indramayu.',
  alternates: { canonical: '/agenda' },
};

const ALL = 'semua';

const statusOptions = [
  { value: ALL, label: 'Semua' },
  { value: 'upcoming', label: 'Akan datang' },
  { value: 'ongoing', label: 'Berlangsung' },
  { value: 'completed', label: 'Selesai' },
];

export default async function AgendaPage({ searchParams }: { searchParams?: { status?: string } }) {
  const requested = (searchParams?.status ?? ALL).toUpperCase();
  const status = isAgendaStatus(requested) ? requested : undefined;
  const active = status ? status.toLowerCase() : ALL;
  const agendas = await getAgenda({ status });

  return (
    <div className="civic-container py-12">
      <PageHeader
        title="Agenda kegiatan"
        description="Jadwal resmi kegiatan, perlombaan, pelatihan, dan upacara kepramukaan Kwartir Cabang Indramayu."
      />

      <div className="mb-8">
        <FilterChips
          label="Filter status agenda"
          param="status"
          active={active}
          options={statusOptions}
        />
      </div>

      <p className="mb-4 text-sm text-text-secondary" aria-live="polite">
        {agendas.length} agenda ditampilkan
        {active === ALL ? '' : ` dengan status ${statusOptions.find((o) => o.value === active)?.label.toLowerCase()}`}.
      </p>

      {agendas.length === 0 ? (
        <EmptyState
          icon={CalendarX2}
          title="Tidak ada agenda pada status ini"
          description="Coba status lain, atau tampilkan seluruh agenda yang tercatat."
          action={{ label: 'Tampilkan semua agenda', href: '/agenda' }}
        />
      ) : (
        <ul className="space-y-4">
          {agendas.map((agenda) => (
            <li key={agenda.id}>
              <Card as="article" hoverable className="relative">
                <CardContent className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <AgendaStatusBadge status={agenda.status} />
                    <h2 className="mt-3 font-display text-xl font-bold leading-snug text-text-primary">
                      <Link
                        href={`/agenda/${agenda.slug}`}
                        className="stretched-link rounded-md hover:text-text-accent"
                      >
                        {agenda.title}
                      </Link>
                    </h2>
                    <p className="mt-2 max-w-prose text-sm text-text-secondary">
                      {agenda.description}
                    </p>
                    <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-secondary">
                      <div className="flex items-center gap-2">
                        <dt>
                          <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span className="sr-only">Tanggal</span>
                        </dt>
                        <dd>{formatDateRange(agenda.dateStart, agenda.dateEnd)}</dd>
                      </div>
                      <div className="flex items-center gap-2">
                        <dt>
                          <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span className="sr-only">Lokasi</span>
                        </dt>
                        <dd>{agenda.location}</dd>
                      </div>
                      <div className="flex items-center gap-2">
                        <dt>
                          <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span className="sr-only">Penyelenggara</span>
                        </dt>
                        <dd>{agenda.organizer}</dd>
                      </div>
                    </dl>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
