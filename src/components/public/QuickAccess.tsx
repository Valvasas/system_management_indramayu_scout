import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Section } from '../ui/Section';
import { GolonganIcon } from './GolonganIcon';
import { golongan, golonganAnchor } from '@/lib/golongan';

/** Empat pintu masuk sesuai golongan. Seluruh kartu adalah area klik (stretched-link). */
export const QuickAccess: React.FC = () => (
  <Section
    id="akses-cepat"
    title="Akses cepat per golongan"
    description="Pilih golongan untuk melihat informasi yang sesuai."
  >
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {golongan.map((g) => (
        <li
          key={g.id}
          className="group relative flex items-center gap-4 rounded-lg border border-border-subtle bg-surface-base p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <GolonganIcon id={g.id} />
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg font-bold text-text-primary">
              <Link
                href={`/tentang#${golonganAnchor(g.id)}`}
                className="stretched-link rounded-lg group-hover:text-text-accent"
              >
                {g.name}
              </Link>
            </h3>
            <p className="text-sm text-text-secondary">{g.age}</p>
          </div>
          <ChevronRight
            className="h-5 w-5 shrink-0 text-text-muted transition-colors group-hover:text-text-accent"
            aria-hidden="true"
          />
        </li>
      ))}
    </ul>
  </Section>
);
