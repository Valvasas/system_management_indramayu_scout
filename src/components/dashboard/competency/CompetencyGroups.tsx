import React from 'react';
import { ChevronDown } from 'lucide-react';
import { KIND_LABELS } from '@/features/competency/labels';
import type { ProgressGroup, ProgressItem } from '@/features/competency/progress';
import { formatDate } from '@/lib/format';
import { VerificationBadge } from './CompetencyBadges';
import { ProgressMeter } from './ProgressMeter';

const groupId = (prefix: string, g: ProgressGroup, i: number) => `${prefix}-${g.kind.toLowerCase()}-${i}`;

function ItemRow({
  item,
  showInternal,
  control,
}: {
  item: ProgressItem;
  showInternal: boolean;
  control?: (item: ProgressItem) => React.ReactNode;
}) {
  const { requirement: req, verified, revoked } = item;
  const note = verified?.note ?? (!verified ? revoked?.note : null);
  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="break-words text-xs font-semibold tracking-wide text-text-secondary">{req.code}</p>
        <p className="mt-0.5 break-words font-medium text-text-primary">{req.title}</p>
        {req.description && <p className="mt-1 whitespace-pre-line break-words text-sm text-text-secondary">{req.description}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-secondary">
          <VerificationBadge item={item} />
          {verified ? (
            <span>
              {formatDate(verified.at.toISOString())} · oleh {verified.byName}
            </span>
          ) : revoked ? (
            <span>
              Dibatalkan {formatDate(revoked.at.toISOString())}
              {revoked.byName ? ` · oleh ${revoked.byName}` : ''}
            </span>
          ) : null}
        </div>
        {showInternal && note && (
          <p className="mt-1.5 whitespace-pre-line break-words text-sm text-text-secondary">
            <span className="font-medium text-text-primary">{verified ? 'Catatan:' : 'Alasan pembatalan:'}</span> {note}
          </p>
        )}
      </div>
      {control && <div className="shrink-0">{control(item)}</div>}
    </li>
  );
}

/**
 * Kemajuan SKU/SKK per jenis + tingkatan. `collapseComplete`: kelompok yang sudah lengkap dilipat
 * (tampilan peserta); di tampilan staf semua terbuka agar pesan hasil verifikasi tidak ikut
 * tersembunyi saat kelompok menjadi lengkap. `showInternal` = staf (catatan & alasan pembatalan);
 * peserta tidak pernah melihatnya (datanya pun sudah dibuang di server, lihat
 * features/competency/competency.ts).
 */
export function CompetencyGroups({
  groups,
  showInternal,
  control,
  idPrefix = 'sku',
  collapseComplete = true,
}: {
  groups: ProgressGroup[];
  showInternal: boolean;
  control?: (item: ProgressItem) => React.ReactNode;
  idPrefix?: string;
  collapseComplete?: boolean;
}) {
  return (
    <div className="space-y-6">
      {groups.map((g, i) => {
        const id = groupId(idPrefix, g, i);
        const complete = g.total > 0 && g.verified >= g.total;
        return (
          <section key={`${g.kind}-${g.level}`} aria-labelledby={id} className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h3 id={id} className="font-display text-lg font-semibold text-text-primary">
                {KIND_LABELS[g.kind]} · {g.level}
              </h3>
              {g.lastVerifiedAt && (
                <p className="text-sm text-text-secondary">Verifikasi terakhir {formatDate(g.lastVerifiedAt.toISOString())}</p>
              )}
            </div>
            <ProgressMeter verified={g.verified} total={g.total} percent={g.percent} />
            <details className="group rounded-xl border border-border-subtle" open={!(collapseComplete && complete)}>
              <summary className="flex min-h-touch cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-4 text-sm font-semibold text-text-primary hover:bg-surface-subtle [&::-webkit-details-marker]:hidden">
                Rincian {g.total} syarat
                <ChevronDown
                  className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </summary>
              <ul className="divide-y divide-border-subtle border-t border-border-subtle px-4">
                {g.items.map((item) => (
                  <ItemRow key={item.requirement.id} item={item} showInternal={showInternal} control={control} />
                ))}
              </ul>
            </details>
          </section>
        );
      })}
    </div>
  );
}
