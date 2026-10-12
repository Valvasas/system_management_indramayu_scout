import React from 'react';
import { progressLabel } from '@/features/competency/progress';
import { cn } from '@/lib/utils';

/**
 * Kemajuan satu kelompok syarat: teks yang terlihat ("2 dari 5 terverifikasi", 40%) membawa
 * maknanya; bilah hanya penguat visual (aria-hidden), jadi tidak ada informasi lewat warna saja.
 */
export function ProgressMeter({
  verified,
  total,
  percent,
  className,
}: {
  verified: number;
  total: number;
  percent: number;
  className?: string;
}) {
  const done = total > 0 && verified >= total;
  return (
    <div className={cn('space-y-1.5', className)}>
      <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
        <span className="font-semibold text-text-primary">{progressLabel({ verified, total })}</span>
        <span className="tabular-nums text-text-secondary">{done ? 'Lengkap · 100%' : `${percent}%`}</span>
      </p>
      <div className="h-2 overflow-hidden rounded-pill bg-surface-sunken" aria-hidden="true">
        <div
          className={cn('h-full rounded-pill', done ? 'bg-status-success-text' : 'bg-action-primary')}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
