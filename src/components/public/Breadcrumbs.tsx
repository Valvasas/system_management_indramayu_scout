import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Jejak navigasi "Beranda › Bagian › Halaman". Selalu diawali Beranda supaya
 * pengunjung tahu posisinya dan bisa kembali satu langkah tanpa tombol Back.
 */
export const Breadcrumbs: React.FC<{ items: Crumb[]; className?: string }> = ({ items, className }) => (
  <nav aria-label="Jejak navigasi" className={className}>
    <ol className="flex flex-wrap items-center gap-x-1 text-sm text-text-secondary">
      <li className="flex items-center">
        <Link href="/" className="inline-flex min-h-touch items-center gap-1.5 rounded-lg pr-1 hover:text-text-primary">
          <Home className="h-4 w-4" aria-hidden="true" />
          Beranda
        </Link>
      </li>
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1">
            <ChevronRight className="h-4 w-4 text-text-muted" aria-hidden="true" />
            {item.href && !last ? (
              <Link href={item.href} className="inline-flex min-h-touch items-center rounded-lg px-1 hover:text-text-primary">
                {item.label}
              </Link>
            ) : (
              <span aria-current={last ? 'page' : undefined} className="px-1 font-medium text-text-primary">
                {item.label}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  </nav>
);
