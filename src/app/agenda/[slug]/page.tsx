import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays, MapPin, Phone, Users } from 'lucide-react';
import { AgendaStatusBadge, agendaStatusLabel } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { getAgendaBySlug, getAgendaSlugs } from '@/lib/repositories';
import { formatDate, formatDateRange } from '@/lib/format';
import { absoluteUrl } from '@/lib/site';

interface Params {
  params: { slug: string };
}

/** Slug di luar daftar -> 404 sungguhan, bukan halaman galat berstatus 200. */
export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await getAgendaSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const agenda = await getAgendaBySlug(params.slug);
  if (!agenda) return { title: 'Agenda tidak ditemukan', robots: { index: false } };

  const url = `/agenda/${agenda.slug}`;
  return {
    title: agenda.title,
    description: `${agenda.description} — ${formatDateRange(agenda.dateStart, agenda.dateEnd)} di ${agenda.location}.`,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: agenda.title,
      description: agenda.description,
      url: absoluteUrl(url),
    },
  };
}

export default async function AgendaDetailPage({ params }: Params) {
  const agenda = await getAgendaBySlug(params.slug);
  if (!agenda) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: agenda.title,
    description: agenda.description,
    startDate: agenda.dateStart,
    endDate: agenda.dateEnd,
    eventStatus:
      agenda.status === 'CANCELLED'
        ? 'https://schema.org/EventCancelled'
        : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: { '@type': 'Place', name: agenda.location },
    organizer: { '@type': 'Organization', name: agenda.organizer },
    url: absoluteUrl(`/agenda/${agenda.slug}`),
  };

  return (
    <div className="civic-container py-12">
      <nav aria-label="Remah roti" className="mb-6">
        <Link
          href="/agenda"
          className="inline-flex min-h-touch items-center gap-2 rounded-md text-sm font-medium text-text-accent hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke daftar agenda
        </Link>
      </nav>

      <article className="max-w-3xl">
        <AgendaStatusBadge status={agenda.status} />
        <h1 className="mt-4 font-display text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-text-primary">
          {agenda.title}
        </h1>

        <Card className="mt-8">
          <CardContent>
            <h2 className="sr-only">Rincian pelaksanaan</h2>
            <dl className="grid gap-5 sm:grid-cols-2">
              <div className="flex gap-3">
                <dt className="shrink-0">
                  <CalendarDays className="h-5 w-5 text-text-muted" aria-hidden="true" />
                  <span className="sr-only">Jadwal</span>
                </dt>
                <dd>
                  <span className="block text-xs text-text-secondary">Jadwal pelaksanaan</span>
                  <strong className="text-text-primary">
                    <time dateTime={agenda.dateStart}>
                      {formatDateRange(agenda.dateStart, agenda.dateEnd)}
                    </time>
                  </strong>
                </dd>
              </div>
              <div className="flex gap-3">
                <dt className="shrink-0">
                  <MapPin className="h-5 w-5 text-text-muted" aria-hidden="true" />
                  <span className="sr-only">Lokasi</span>
                </dt>
                <dd>
                  <span className="block text-xs text-text-secondary">Lokasi kegiatan</span>
                  <strong className="text-text-primary">{agenda.location}</strong>
                </dd>
              </div>
              <div className="flex gap-3">
                <dt className="shrink-0">
                  <Users className="h-5 w-5 text-text-muted" aria-hidden="true" />
                  <span className="sr-only">Penyelenggara</span>
                </dt>
                <dd>
                  <span className="block text-xs text-text-secondary">Penyelenggara</span>
                  <strong className="text-text-primary">{agenda.organizer}</strong>
                </dd>
              </div>
              <div className="flex gap-3">
                <dt className="shrink-0">
                  <Phone className="h-5 w-5 text-text-muted" aria-hidden="true" />
                  <span className="sr-only">Narahubung</span>
                </dt>
                <dd>
                  <span className="block text-xs text-text-secondary">Narahubung</span>
                  <strong className="text-text-primary">{agenda.contactPerson}</strong>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <section className="mt-8">
          <h2 className="font-display text-xl font-bold text-text-primary">Deskripsi kegiatan</h2>
          <p className="mt-3 civic-prose">{agenda.description}</p>
          <p className="mt-3 text-sm text-text-muted">
            Status terkini: {agendaStatusLabel(agenda.status)} · diperbarui{' '}
            {formatDate(agenda.dateStart)}.
          </p>
        </section>

        <section className="mt-8 flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface-subtle p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-text-primary">Petunjuk pelaksanaan & teknis</h2>
            <p className="text-sm text-text-secondary">
              Edaran dan panduan resmi panitia tersedia di pusat dokumen.
            </p>
          </div>
          <ButtonLink href="/dokumen" variant="outline" className="shrink-0">
            Buka pusat dokumen
          </ButtonLink>
        </section>
      </article>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
