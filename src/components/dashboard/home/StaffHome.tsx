import React from 'react';
import Link from 'next/link';
import { count, desc, eq, isNull } from 'drizzle-orm';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, FileEdit, Inbox, MapPinOff, Megaphone, Upload, UserPlus, type LucideIcon } from 'lucide-react';
import { getDb, schema } from '@/db';
import { ButtonLink } from '@/components/ui/Button';
import { PortalWelcome, Panel } from '@/components/dashboard/ui';
import { announcementsFor } from '@/features/announcements/queries';
import { gudepLocationCoverage } from '@/features/gudep/queries';
import { golonganCounts, memberStatusCounts } from '@/features/members/queries';
import { can, type SessionUser } from '@/lib/auth/session';
import { GOLONGAN_OPTIONS } from '@/lib/domain';
import { formatDate, formatTime, greeting } from '@/lib/format';

interface Task {
  count: number;
  label: string;
  hint: string;
  href: string;
  icon: LucideIcon;
}

export async function StaffHome({ user, notice }: { user: SessionUser; notice?: React.ReactNode }) {
  const db = await getDb();
  const tasks: Task[] = [];

  const counts = can(user, 'members.read') ? await memberStatusCounts(user) : null;
  if (counts) {
    if (can(user, 'members.verify') && counts.PENDING)
      tasks.push({ count: counts.PENDING, label: 'Data anggota menunggu verifikasi', hint: 'Periksa lalu setujui atau kembalikan.', href: '/dashboard/anggota?status=PENDING', icon: Clock });
    if (counts.NEEDS_FIX)
      tasks.push({ count: counts.NEEDS_FIX, label: 'Data dikembalikan untuk diperbaiki', hint: 'Lihat catatan verifikator, perbaiki, simpan ulang.', href: '/dashboard/anggota?status=NEEDS_FIX', icon: AlertTriangle });
  }
  const coverage = can(user, 'gudep.read') ? await gudepLocationCoverage(user) : null;
  if (coverage && coverage.total - coverage.located > 0)
    tasks.push({ count: coverage.total - coverage.located, label: 'Gudep belum punya titik lokasi', hint: 'Tandai lokasi di peta agar mudah ditemukan.', href: '/dashboard/gudep?lokasi=tanpa', icon: MapPinOff });
  if (can(user, 'messages.read')) {
    const [r] = await db.select({ n: count() }).from(schema.contactMessages).where(isNull(schema.contactMessages.readAt));
    if (r.n) tasks.push({ count: r.n, label: 'Pesan masuk belum dibaca', hint: 'Dari formulir Kontak situs publik.', href: '/dashboard/pesan', icon: Inbox });
  }
  if (can(user, 'content.manage')) {
    const [r] = await db.select({ n: count() }).from(schema.news).where(eq(schema.news.status, 'DRAFT'));
    if (r.n) tasks.push({ count: r.n, label: 'Berita masih draf', hint: 'Periksa dan terbitkan bila sudah siap.', href: '/dashboard/konten/berita', icon: FileEdit });
  }

  const golongan = counts ? await golonganCounts(user) : [];
  const totalActive = golongan.reduce((s, g) => s + g.n, 0);
  const news = await announcementsFor(user, 3);
  const logs = can(user, 'audit.view')
    ? await db.select().from(schema.auditLogs).orderBy(desc(schema.auditLogs.at)).limit(5)
    : [];

  return (
    <>
      <PortalWelcome
        title={`${greeting()}, ${user.name.split(' ')[0]}`}
        subtitle="Berikut yang perlu Anda perhatikan hari ini."
        actions={
          <>
          {can(user, 'members.create') && (
            <ButtonLink href="/dashboard/anggota/baru">
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Tambah anggota
            </ButtonLink>
          )}
          {can(user, 'members.import') && (
            <ButtonLink href="/dashboard/anggota/impor" variant="outline">
              <Upload className="h-4 w-4" aria-hidden="true" />
              Impor dari Excel
            </ButtonLink>
          )}
          {can(user, 'content.manage') && !can(user, 'members.create') && (
            <ButtonLink href="/dashboard/konten/berita/baru">
              <FileEdit className="h-4 w-4" aria-hidden="true" />
              Tulis berita
            </ButtonLink>
          )}
          </>
        }
      />
      {notice}

      <section aria-labelledby="tugas-title">
        <h2 id="tugas-title" className="font-display text-lg font-semibold text-text-primary">
          Perlu tindakan
        </h2>
        {tasks.length === 0 ? (
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-status-success-border bg-status-success-surface px-5 py-4 text-status-success-text">
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
            <p className="font-medium">Semua beres. Tidak ada pekerjaan yang menunggu.</p>
          </div>
        ) : (
          <ul className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tasks.map((t) => (
              <li key={t.label} className="group relative flex gap-4 rounded-2xl border border-border-subtle bg-surface-base p-5 shadow-sm transition-shadow hover:shadow-md">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-meadow text-text-accent">
                  <t.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-2xl font-semibold text-text-primary">{t.count.toLocaleString('id-ID')}</p>
                  <Link href={t.href} className="stretched-link font-medium text-text-primary group-hover:text-text-accent">
                    {t.label}
                  </Link>
                  <p className="mt-0.5 text-sm text-text-secondary">{t.hint}</p>
                </div>
                <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-text-muted group-hover:text-text-accent" aria-hidden="true" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {counts && (
          <Panel
            title="Anggota aktif per golongan"
            description={`${totalActive.toLocaleString('id-ID')} anggota aktif dalam wilayah Anda`}
            action={
              <Link href="/dashboard/anggota" className="inline-flex min-h-touch items-center gap-1 text-sm font-semibold text-text-accent hover:underline">
                Lihat data
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          >
            <ul className="space-y-3">
              {GOLONGAN_OPTIONS.map((o) => {
                const n = golongan.find((g) => g.golongan === o.value)?.n ?? 0;
                const pct = totalActive ? Math.round((n / totalActive) * 100) : 0;
                return (
                  <li key={o.value}>
                    <div className="flex items-baseline justify-between text-sm">
                      <Link href={`/dashboard/anggota?golongan=${o.value}&status=ACTIVE`} className="font-medium text-text-primary hover:text-text-accent hover:underline">
                        {o.label}
                      </Link>
                      <span className="text-text-secondary">{n.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-pill bg-surface-sunken" aria-hidden="true">
                      <div className="h-full rounded-pill bg-action-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        )}

        <Panel
          title="Pengumuman terbaru"
          action={
            can(user, 'announcements.manage') ? (
              <Link href="/dashboard/pengumuman" className="inline-flex min-h-touch items-center gap-1 text-sm font-semibold text-text-accent hover:underline">
                Kelola
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : undefined
          }
        >
          {news.length === 0 ? (
            <p className="flex items-center gap-2 text-text-secondary">
              <Megaphone className="h-4 w-4" aria-hidden="true" />
              Belum ada pengumuman.
            </p>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {news.map(({ a, gudepName }) => (
                <li key={a.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="font-medium text-text-primary">{a.title}</p>
                  <p className="mt-0.5 text-sm text-text-secondary">
                    {a.authorName}
                    {gudepName ? ` · ${gudepName}` : ''} · {formatDate(a.createdAt.toISOString())}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {logs.length > 0 && (
          <Panel
            title="Aktivitas terbaru"
            className="lg:col-span-2"
            action={
              <Link href="/dashboard/log" className="inline-flex min-h-touch items-center gap-1 text-sm font-semibold text-text-accent hover:underline">
                Semua log
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          >
            <ol className="divide-y divide-border-subtle">
              {logs.map((l) => (
                <li key={l.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:gap-6">
                  <time dateTime={l.at.toISOString()} className="w-44 shrink-0 text-sm text-text-secondary">
                    {formatDate(l.at.toISOString())}, {formatTime(l.at.toISOString())}
                  </time>
                  <p className="text-text-primary">
                    <span className="font-semibold">{l.actorName}</span> <span className="text-text-secondary">— {l.summary}</span>
                  </p>
                </li>
              ))}
            </ol>
          </Panel>
        )}
      </div>
    </>
  );
}

