'use client';

import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterChipsProps {
  /** Label grup untuk pembaca layar, mis. "Filter kategori berita". */
  label: string;
  /** Nama query param di URL, mis. "kategori". */
  param: string;
  options: FilterOption[];
  /** Nilai aktif saat ini (hasil baca searchParams di server). */
  active: string;
  /** Nilai default yang dihapus dari URL, bukan ditulis. */
  defaultValue?: string;
}

/**
 * Chip filter yang menyimpan state di URL (P4-5) sehingga hasil filter
 * bisa dibagikan, di-bookmark, dan tombol Back mengembalikannya.
 * Memakai aria-pressed di dalam group ber-label — bukan role="tab",
 * karena tidak ada tabpanel yang dipasangkan.
 */
export const FilterChips: React.FC<FilterChipsProps> = ({
  label,
  param,
  options,
  active,
  defaultValue = 'semua',
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const select = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === defaultValue) params.delete(param);
    else params.set(param, value);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((opt) => {
        const isActive = opt.value === active;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => select(opt.value)}
            className={cn(
              'inline-flex items-center min-h-touch rounded-pill px-4 text-sm font-medium transition-colors border',
              isActive
                ? 'bg-action-primary text-text-on-brand border-action-primary'
                : 'bg-surface-base text-text-secondary border-border-strong hover:bg-surface-subtle hover:text-text-primary',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
