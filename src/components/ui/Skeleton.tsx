import React from 'react';
import { cn } from '@/lib/utils';

/** Rangka muat. `animate-pulse` otomatis diredam oleh prefers-reduced-motion. */
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse rounded-md bg-surface-sunken', className)} />
);

/** Placeholder daftar kartu untuk loading.tsx per rute. */
export const CardListSkeleton: React.FC<{ count?: number; columns?: string }> = ({
  count = 6,
  columns = 'sm:grid-cols-2 lg:grid-cols-3',
}) => (
  <div className={cn('grid gap-6', columns)} aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-lg border border-border-subtle p-4">
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="mt-4 h-4 w-2/3" />
        <Skeleton className="mt-2 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-5/6" />
      </div>
    ))}
  </div>
);

export const PageLoading: React.FC<{ title: string; columns?: string; count?: number }> = ({
  title,
  columns,
  count,
}) => (
  <div className="civic-container py-12">
    <p role="status" className="sr-only">
      {title} sedang dimuat
    </p>
    <Skeleton className="h-9 w-64" />
    <Skeleton className="mt-3 h-4 w-full max-w-prose" />
    <div className="mt-8 flex gap-2" aria-hidden="true">
      <Skeleton className="h-11 w-24 rounded-pill" />
      <Skeleton className="h-11 w-28 rounded-pill" />
      <Skeleton className="h-11 w-24 rounded-pill" />
    </div>
    <div className="mt-8">
      <CardListSkeleton columns={columns} count={count} />
    </div>
  </div>
);
