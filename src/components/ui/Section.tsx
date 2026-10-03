import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { ButtonLink } from './Button';

export interface SectionProps {
  id: string;
  /** Judul section. Selalu h2 — h1 milik halaman. */
  title: string;
  description?: string;
  /** Latar bergantian memisahkan section tanpa garis border berulang (P2-4). */
  surface?: 'canvas' | 'base';
  /** Section utama bernapas lebih lega daripada section pendukung. */
  emphasis?: 'primary' | 'secondary';
  /** Tautan "lihat semua" — selalu subordinat terhadap satu aksi utama halaman (P2-3). */
  action?: { label: string; href: string };
  className?: string;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({
  id,
  title,
  description,
  surface = 'canvas',
  emphasis = 'secondary',
  action,
  className,
  children,
}) => (
  <section
    aria-labelledby={`${id}-title`}
    className={cn(
      // canvas = latar halaman gray-50; base = pita putih berbatas garis tipis.
      surface === 'base' ? 'border-y border-border-subtle bg-surface-base' : 'bg-surface-canvas',
      emphasis === 'primary' ? 'civic-section' : 'civic-section-sm',
      className,
    )}
  >
    <div className="civic-container">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id={`${id}-title`}
            className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-text-primary"
          >
            {title}
          </h2>
          {description && <p className="mt-2 max-w-prose text-base text-text-secondary">{description}</p>}
        </div>
        {action && (
          <ButtonLink href={action.href} variant="outline" size="sm" className="shrink-0 self-start sm:self-auto">
            {action.label}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </ButtonLink>
        )}
      </div>
      {children}
    </div>
  </section>
);

export interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

/** Kepala halaman: satu h1, lede dibatasi lebar baca (P3-7). */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  className,
  children,
}) => (
  <header className={cn('mb-8', className)}>
    <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
      {title}
    </h1>
    {description && <p className="mt-3 max-w-prose text-base sm:text-lg text-text-secondary">{description}</p>}
    {children}
  </header>
);
