import React from 'react';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, CalendarCheck2, CalendarPlus, Clock, MapPin, Megaphone } from 'lucide-react';
import { Panel, PortalWelcome } from '@/components/dashboard/ui';
import { announcementsFor } from '@/features/announcements/queries';
import { getOwnMember, upcomingEventsFor } from '@/features/portal/peserta';
import type { SessionUser } from '@/lib/auth/session';
import { golonganLabel } from '@/lib/domain';
import { formatDate, formatTime, greeting } from '@/lib/format';

/**
 * Peserta (sering usia sekolah): begitu dibuka langsung terlihat kegiatan yang diikuti,
 * kegiatan yang bisa didaftari, dan pengumuman gudepnya. Tanpa angka/statistik.
 */
export async function PesertaHome({ user, notice }: { user: SessionUser; notice?: React.ReactNode }) {
  const [own, events, news] = await Promise.all([getOwnMember(user), upcomingEventsFor(user), announcementsFor(user, 5)]);
  const mine = events.filter((e) => e.registered);
  const open = events.filter((e) => !e.registered && e.registrationOpen);

  return (
    <>
      <PortalWelcome
        title={`${greeting()}, ${user.name.split(' ')[0]}`}
        subtitle={own ? `${golonganLabel(own.m.golongan)} · ${own.gudep.name}` : undefined}
        scene="camp"
      />
      {notice}

      {open.length > 0 && (
        <section
          aria-labelledby="buka-title"
          className="mb-6 flex flex-col gap-4 rounded-lg border border-border-brand bg-surface-brand-tint p-5 sm:flex-row sm:items-center sm:p-6"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-base text-text-accent">
            <CalendarPlus className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <h2 id="buka-title" className="font-display text-lg font-semibold text-text-primary">
              {open.length} kegiatan membuka pendaftaran
            </h2>
            <p className="text-text-secondary">Terdekat: {open[0].title}, {formatDate(open[0].dateStart.toISOString())}.</p>
          </div>
          <Link
            href="/dashboard/kegiatan"
            className="inline-flex min-h-touch items-center justify-center gap-2 rounded-lg bg-action-primary px-5 font-semibold text-text-on-brand hover:bg-action-primary-hover"
          >
            Lihat & daftar
          </Link>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <Panel title="Kegiatan saya" className="lg:col-span-7">
          {mine.length === 0 ? (
            <p className="flex items-center gap-2 text-text-secondary">
              <CalendarCheck2 className="h-4 w-4" aria-hidden="true" />
              Anda belum terdaftar di kegiatan mendatang.
            </p>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {mine.map((e) => (
                <li key={e.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="font-semibold text-text-primary">{e.title}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-text-secondary">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    {formatDate(e.dateStart.toISOString())}, {formatTime(e.dateStart.toISOString())}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-text-secondary">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                    {e.location}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <Link href="/dashboard/kegiatan" className="mt-4 inline-flex min-h-touch items-center gap-1 text-sm font-semibold text-text-accent hover:underline">
            Semua kegiatan
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Panel>

        <Panel title="Data keanggotaan" className="lg:col-span-5">
          {own ? (
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-text-secondary">Gugus depan</dt>
                <dd className="font-medium text-text-primary">{own.gudep.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-text-secondary">Pembina / kontak gudep</dt>
                <dd className="font-medium text-text-primary">{own.gudep.contactName ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-sm text-text-secondary">Kartu Tanda Anggota</dt>
                <dd className="flex items-center gap-1.5 font-medium text-text-primary">
                  {own.m.kta ? (
                    <>
                      <BadgeCheck className="h-4 w-4 text-status-success-text" aria-hidden="true" />
                      {own.m.kta}
                    </>
                  ) : (
                    'Belum terbit'
                  )}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-text-secondary">Data keanggotaan tidak ditemukan. Hubungi pembina gudep Anda.</p>
          )}
          <Link href="/dashboard/profil" className="mt-4 inline-flex min-h-touch items-center gap-1 text-sm font-semibold text-text-accent hover:underline">
            Lihat profil lengkap
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Panel>

        <Panel title="Pengumuman" className="lg:col-span-12">
          {news.length === 0 ? (
            <p className="flex items-center gap-2 text-text-secondary">
              <Megaphone className="h-4 w-4" aria-hidden="true" />
              Belum ada pengumuman.
            </p>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {news.map(({ a, gudepName }) => (
                <li key={a.id} className="py-4 first:pt-0 last:pb-0">
                  <p className="font-semibold text-text-primary">{a.title}</p>
                  <p className="mt-1 whitespace-pre-line text-text-secondary">{a.body}</p>
                  <p className="mt-1 text-sm text-text-muted">
                    {gudepName ?? 'Kwarcab Indramayu'} · {formatDate(a.createdAt.toISOString())}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
