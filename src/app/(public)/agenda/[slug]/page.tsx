import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays, CalendarPlus, Clock, MapPin, Navigation, Phone, Users } from 'lucide-react';
import { AgendaStatusBadge } from '@/components/ui/Badge';
import { PageHero } from '@/components/ui/Section';
import { Breadcrumbs } from '@/components/public/Breadcrumbs';
import { paragraphs } from '@/lib/reading';
import { ButtonLink } from '@/components/ui/Button';
import { getAgendaBySlug, getAgendaSlugs } from '@/lib/repositories';
import { formatDateRange, formatDayMonth, formatTime } from '@/lib/format';
import { absoluteUrl } from '@/lib/site';

interface Params {
  params: { slug: string };
}

/**
 * Slug yang belum ada saat build (konten baru dari CMS) dirender saat diminta, lalu di-cache.
 * Slug yang tidak ada di basis data memanggil notFound() di bawah → 404.
 */
export const dynamicParams = true;

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

  const day = formatDayMonth(agenda.dateStart);
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${agenda.location}, Indramayu`)}`;

  return (
    <div>
      <PageHero
        eyebrow="Agenda kegiatan"
        title={agenda.title}
        scene="camp"
        top={<Breadcrumbs items={[{ label: 'Agenda', href: '/agenda' }, { label: agenda.title }]} />}
      >
        <AgendaStatusBadge status={agenda.status} />
      </PageHero>

      <div className="civic-container grid gap-10 pb-16 pt-6 sm:pb-24 lg:grid-cols-[1fr_22rem]">
        <article aria-labelledby="deskripsi-title" className="min-w-0">
          <h2 id="deskripsi-title" className="font-display text-display-md font-semibold text-text-primary">
            Tentang kegiatan
          </h2>
          <div className="mt-5 max-w-prose space-y-5 text-[1.05rem] leading-[1.8] text-text-secondary">
            {paragraphs(agenda.description).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <section aria-labelledby="juknis-title" className="mt-10 flex flex-col gap-4 rounded-2xl bg-surface-sand p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="juknis-title" className="font-semibold text-text-primary">Petunjuk pelaksanaan & teknis</h2>
              <p className="text-sm text-text-secondary">Edaran dan panduan resmi panitia tersedia di Pusat Dokumen.</p>
            </div>
            <ButtonLink href="/dokumen" variant="outline" className="shrink-0">
              Buka pusat dokumen
            </ButtonLink>
          </section>

          <Link href="/agenda" className="mt-8 inline-flex min-h-touch items-center gap-2 rounded-md text-sm font-semibold text-text-accent hover:underline">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Semua agenda
          </Link>
        </article>

        <aside aria-labelledby="tiket-title" className="lg:sticky lg:top-28 lg:self-start">
          <div className="overflow-hidden rounded-3xl border border-border-subtle bg-surface-base shadow-md">
            <div className="flex items-center gap-4 bg-surface-forest p-5 text-text-inverse">
              <div className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-surface-base py-1.5 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-text-warm">{day.month}</span>
                <span className="font-display text-3xl font-semibold leading-none text-text-primary">{day.day}</span>
              </div>
              <div>
                <h2 id="tiket-title" className="font-display text-lg font-semibold">
                  Rincian pelaksanaan
                </h2>
                <p className="text-sm capitalize text-text-inverse-muted">{day.weekday}</p>
              </div>
            </div>
            <dl className="divide-y divide-border-subtle px-5">
              {[
                { icon: CalendarDays, label: 'Jadwal', value: <time dateTime={agenda.dateStart}>{formatDateRange(agenda.dateStart, agenda.dateEnd)}</time> },
                { icon: Clock, label: 'Waktu', value: formatTime(agenda.dateStart) },
                { icon: MapPin, label: 'Lokasi', value: agenda.location },
                { icon: Users, label: 'Penyelenggara', value: agenda.organizer },
                ...(agenda.contactPerson ? [{ icon: Phone, label: 'Narahubung', value: agenda.contactPerson }] : []),
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-3 py-3.5">
                  <dt className="mt-0.5 shrink-0">
                    <Icon className="h-5 w-5 text-text-accent" aria-hidden="true" />
                    <span className="sr-only">{label}</span>
                  </dt>
                  <dd>
                    <span className="block text-xs text-text-secondary" aria-hidden="true">
                      {label}
                    </span>
                    <span className="font-semibold text-text-primary">{value}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <div className="grid gap-2 p-5 pt-2">
              <ButtonLink href={`/agenda/${agenda.slug}/kalender.ics`} variant="primary">
                <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                Simpan ke kalender
              </ButtonLink>
              <ButtonLink href={mapsHref} variant="outline" target="_blank">
                <Navigation className="h-4 w-4" aria-hidden="true" />
                Petunjuk arah
                <span className="sr-only">(Google Maps, tab baru)</span>
              </ButtonLink>
            </div>
          </div>
          <p className="mt-4 px-1 text-sm text-text-secondary">
            Peserta yang datanya sudah terverifikasi dapat mendaftar lewat{' '}
            <Link href="/masuk" className="font-semibold text-text-accent underline underline-offset-2">
              portal
            </Link>
            .
          </p>
        </aside>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
