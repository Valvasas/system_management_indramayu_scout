import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  EyeOff,
  FileEdit,
  type LucideIcon,
} from 'lucide-react';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import type { MemberStatus } from '@/db/schema';
import { MEMBER_STATUS_LABELS } from '@/lib/domain';
import { cn } from '@/lib/utils';
import { SceneStrip, type SceneVariant } from '@/components/illustrations/Scenes';

/* ---------------- Kepala halaman ---------------- */

export const PortalHeader: React.FC<{
  title: string;
  description?: React.ReactNode;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}> = ({ title, description, back, actions }) => (
  <header className="mb-6">
    {back && (
      <Link
        href={back.href}
        className="-ml-2 mb-2 inline-flex min-h-touch items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {back.label}
      </Link>
    )}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-display-md font-semibold text-text-primary">{title}</h1>
        {description && <div className="mt-1 max-w-prose text-base text-text-secondary">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  </header>
);

/* ---------------- Sapaan bergambar (beranda portal) ---------------- */

const todayLabel = () =>
  new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(
    new Date(),
  );

/** Kepala beranda portal: langit, kontur, dan pita lanskap. Satu h1. */
export const PortalWelcome: React.FC<{ title: string; subtitle?: React.ReactNode; actions?: React.ReactNode; scene?: SceneVariant }> = ({
  title,
  subtitle,
  actions,
  scene = 'forest',
}) => (
  <header className="relative mb-8 overflow-hidden rounded-3xl bg-ill-sky">
    <div className="topo absolute inset-0" aria-hidden="true" />
    <div className="relative z-10 flex flex-col gap-5 p-6 pb-24 sm:p-8 sm:pb-28 lg:flex-row lg:items-end lg:justify-between lg:pb-32">
      <div>
        <p className="eyebrow">{todayLabel()}</p>
        <h1 className="mt-2 font-display text-display-md font-semibold text-text-primary">{title}</h1>
        {subtitle && <div className="mt-1.5 max-w-prose text-text-secondary">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 sm:h-28">
      <SceneStrip variant={scene} />
    </div>
  </header>
);

/* ---------------- Panel ---------------- */

export const Panel: React.FC<{
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
  children: React.ReactNode;
}> = ({ title, description, action, className, bodyClassName, id, children }) => (
  <section
    id={id}
    aria-labelledby={title && id ? `${id}-title` : undefined}
    className={cn('rounded-2xl border border-border-subtle bg-surface-base shadow-sm', className)}
  >
    {title && (
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle px-5 py-4 sm:px-6">
        <div>
          <h2 id={id ? `${id}-title` : undefined} className="font-display text-xl font-semibold text-text-primary">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-sm text-text-secondary">{description}</p>}
        </div>
        {action}
      </div>
    )}
    <div className={cn('px-5 py-4 sm:px-6', bodyClassName)}>{children}</div>
  </section>
);

/* ---------------- Pemberitahuan hasil aksi (?tersimpan=…) ---------------- */

export const Notice: React.FC<{ tone?: 'success' | 'warning' | 'info'; children: React.ReactNode }> = ({ tone = 'success', children }) => {
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'warning' ? AlertTriangle : Clock;
  return (
    <div
      role="status"
      className={cn(
        'mb-6 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm font-medium',
        tone === 'success' && 'border-status-success-border bg-status-success-surface text-status-success-text',
        tone === 'warning' && 'border-status-warning-border bg-status-warning-surface text-status-warning-text',
        tone === 'info' && 'border-status-info-border bg-status-info-surface text-status-info-text',
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
};

/* ---------------- Status ---------------- */

const memberTone: Record<MemberStatus, { tone: BadgeTone; icon: LucideIcon }> = {
  PENDING: { tone: 'info', icon: Clock },
  ACTIVE: { tone: 'success', icon: CheckCircle2 },
  NEEDS_FIX: { tone: 'warning', icon: AlertTriangle },
  ARCHIVED: { tone: 'neutral', icon: Archive },
};

export const MemberStatusBadge: React.FC<{ status: MemberStatus }> = ({ status }) => (
  <Badge tone={memberTone[status].tone} icon={memberTone[status].icon} className="whitespace-nowrap">
    {MEMBER_STATUS_LABELS[status]}
  </Badge>
);

export const PublishBadge: React.FC<{ published: boolean; draftLabel?: string }> = ({ published, draftLabel = 'Draf' }) =>
  published ? (
    <Badge tone="success" icon={CheckCircle2} className="whitespace-nowrap">
      Tayang
    </Badge>
  ) : (
    <Badge tone="neutral" icon={draftLabel === 'Disembunyikan' ? EyeOff : FileEdit} className="whitespace-nowrap">
      {draftLabel}
    </Badge>
  );

/* ---------------- Daftar keterangan ---------------- */

export const InfoList: React.FC<{ items: { label: string; value: React.ReactNode }[]; columns?: 1 | 2 }> = ({ items, columns = 2 }) => (
  <dl className={cn('grid gap-x-6 gap-y-4', columns === 2 && 'sm:grid-cols-2')}>
    {items.map((it) => (
      <div key={it.label}>
        <dt className="text-sm text-text-secondary">{it.label}</dt>
        <dd className="mt-0.5 font-medium text-text-primary">{it.value ?? <span className="text-text-muted">—</span>}</dd>
      </div>
    ))}
  </dl>
);

/* ---------------- Paginasi ---------------- */

export const Pagination: React.FC<{ page: number; pageCount: number; hrefFor: (page: number) => string; total: number; unit: string }> = ({
  page,
  pageCount,
  hrefFor,
  total,
  unit,
}) => (
  <nav aria-label="Halaman" className="mt-4 flex flex-col items-center justify-between gap-3 text-sm text-text-secondary sm:flex-row">
    <p>
      {total.toLocaleString('id-ID')} {unit} · halaman {page} dari {pageCount}
    </p>
    {pageCount > 1 && (
      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            href={hrefFor(page - 1)}
            className="inline-flex min-h-touch items-center gap-1 rounded-lg border border-border-strong bg-surface-base px-3 font-medium text-text-primary hover:bg-surface-subtle"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Sebelumnya
          </Link>
        ) : null}
        {page < pageCount ? (
          <Link
            href={hrefFor(page + 1)}
            className="inline-flex min-h-touch items-center gap-1 rounded-lg border border-border-strong bg-surface-base px-3 font-medium text-text-primary hover:bg-surface-subtle"
          >
            Berikutnya
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    )}
  </nav>
);

/** Bangun URL dengan query yang diperbarui (nilai kosong dihapus). */
export function withQuery(base: string, current: Record<string, string | undefined>, patch: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...current, ...patch })) {
    if (v !== undefined && v !== '' && v !== null) params.set(k, String(v));
  }
  const q = params.toString();
  return q ? `${base}?${q}` : base;
}

/* ---------------- Tabel ---------------- */

/**
 * Pembungkus tabel lebar: gulir horizontal di layar kecil, dapat difokus keyboard.
 * `relative` wajib: tanpanya elemen `sr-only` (position:absolute) di dalam tabel lolos dari
 * overflow-x dan melebarkan seluruh halaman.
 */
export const TableWrap: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div role="region" aria-label={label} tabIndex={0} className="relative -mx-5 overflow-x-auto sm:-mx-6">
    <div className="inline-block min-w-full px-5 align-middle sm:px-6">{children}</div>
  </div>
);

export const th = 'whitespace-nowrap py-3 pr-4 text-left text-sm font-semibold text-text-secondary';
export const td = 'py-3 pr-4 align-top';
