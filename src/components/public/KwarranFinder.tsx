'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Search } from 'lucide-react';

export interface KwarranCard {
  slug: string;
  name: string;
  gudepCount: number;
  activeMembers: number;
}

/**
 * Direktori Kwarran dengan penyaring instan. Daftar lengkap tetap dirender server-side
 * (bekerja tanpa JS); penyaring hanya menyembunyikan yang tidak cocok.
 */
export const KwarranFinder: React.FC<{ items: KwarranCard[] }> = ({ items }) => {
  const [q, setQ] = useState('');
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? items.filter((k) => k.name.toLowerCase().includes(needle)) : items;
  }, [q, items]);

  return (
    <div>
      <div className="relative max-w-md">
        <label htmlFor="kwarran-q" className="sr-only">
          Cari kecamatan
        </label>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" aria-hidden="true" />
        <input
          id="kwarran-q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ketik nama kecamatan, mis. Jatibarang"
          className="h-12 w-full rounded-pill border border-border-strong bg-surface-base pl-12 pr-4 text-base text-text-primary shadow-sm placeholder:text-text-muted"
        />
      </div>
      <p role="status" className="mt-3 text-sm text-text-secondary">
        {shown.length === items.length ? `${items.length} Kwartir Ranting` : `${shown.length} dari ${items.length} Kwarran cocok`}
      </p>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {shown.map((k) => (
          <li key={k.slug}>
            <Link
              href={`/wilayah/${k.slug}`}
              className="lift group flex h-full flex-col rounded-2xl border border-border-subtle bg-surface-base p-5"
            >
              <span className="flex items-start justify-between gap-2">
                <span className="font-display text-xl font-semibold text-text-primary group-hover:text-text-accent">{k.name}</span>
                <ArrowUpRight className="h-5 w-5 shrink-0 text-text-muted group-hover:text-text-accent" aria-hidden="true" />
              </span>
              <span className="mt-3 flex gap-4 text-sm text-text-secondary">
                <span>
                  <strong className="font-semibold tabular-nums text-text-primary">{k.gudepCount}</strong> gudep
                </span>
                <span>
                  <strong className="font-semibold tabular-nums text-text-primary">{k.activeMembers}</strong> anggota aktif
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {shown.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-border-strong p-6 text-center text-text-secondary">
          Tidak ada kecamatan bernama &ldquo;{q}&rdquo;. Periksa ejaan, atau{' '}
          <button type="button" onClick={() => setQ('')} className="font-semibold text-text-accent underline underline-offset-2">
            tampilkan semua
          </button>
          .
        </p>
      )}
    </div>
  );
};
