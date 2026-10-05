import React from 'react';
import Link from 'next/link';
import { CalendarPlus, CalendarX2, MapPin } from 'lucide-react';
import { AgendaStatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { formatDateRange, formatDayMonth } from '@/lib/format';
import { getUpcomingAgenda } from '@/lib/repositories';

/** Agenda terdekat: blok tanggal seperti sobekan kalender + tombol simpan ke kalender. */
export async function UpcomingAgenda() {
  const items = await getUpcomingAgenda(3);

  return (
    <Section
      id="agenda-terdekat"
      eyebrow="Agenda"
      title="Yang akan datang"
      description="Catat tanggalnya, siapkan perlengkapan. Setiap agenda bisa disimpan langsung ke kalender ponsel."
      surface="base"
      action={{ label: 'Semua agenda', href: '/agenda' }}
    >
      {items.length === 0 ? (
        <EmptyState icon={CalendarX2} title="Belum ada agenda terjadwal" description="Jadwal kegiatan berikutnya akan diumumkan di sini." action={{ label: 'Lihat arsip agenda', href: '/agenda' }} />
      ) : (
        <ol className="grid gap-5 lg:grid-cols-3">
          {items.map((a, i) => {
            const d = formatDayMonth(a.dateStart);
            return (
              <Reveal as="li" key={a.id} delay={i * 90}>
                <article className="lift group relative flex h-full gap-5 rounded-2xl border border-border-subtle bg-surface-canvas p-5">
                  <div className="flex w-[4.5rem] shrink-0 flex-col items-center overflow-hidden rounded-xl border border-border-subtle bg-surface-base text-center shadow-sm">
                    <span className="w-full bg-action-primary py-1 text-xs font-bold uppercase tracking-wider text-text-on-brand">{d.month}</span>
                    <span className="py-1.5 font-display text-3xl font-semibold leading-none text-text-primary">{d.day}</span>
                    <span className="pb-2 text-[0.7rem] font-medium capitalize text-text-secondary">{d.weekday}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <AgendaStatusBadge status={a.status} />
                    <h3 className="mt-2 font-display text-xl font-semibold leading-snug text-text-primary">
                      <Link href={`/agenda/${a.slug}`} className="stretched-link rounded-md group-hover:text-text-accent">
                        {a.title}
                      </Link>
                    </h3>
                    <p className="mt-2 text-sm text-text-secondary">{formatDateRange(a.dateStart, a.dateEnd)}</p>
                    <p className="mt-1 flex items-start gap-1.5 text-sm text-text-secondary">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      {a.location}
                    </p>
                    {/* Di atas stretched-link (z-index) agar tetap bisa diklik terpisah. */}
                    <a
                      href={`/agenda/${a.slug}/kalender.ics`}
                      className="relative z-[2] mt-3 inline-flex min-h-touch items-center gap-1.5 rounded-pill text-sm font-semibold text-text-accent hover:underline"
                    >
                      <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                      Simpan ke kalender
                    </a>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </ol>
      )}
    </Section>
  );
}
