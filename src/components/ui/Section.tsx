import React from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Hills, SceneStrip, type SceneVariant } from '@/components/illustrations/Scenes';
import { ButtonLink } from './Button';
import { Reveal } from './Reveal';

export type SectionSurface = 'canvas' | 'base' | 'meadow' | 'sand' | 'sky' | 'forest';

const surfaceClass: Record<SectionSurface, string> = {
  canvas: 'bg-surface-canvas',
  base: 'bg-surface-base',
  meadow: 'bg-surface-meadow',
  sand: 'bg-surface-sand',
  sky: 'bg-surface-sky',
  // Pita hutan gelap: teks otomatis terang & cincin fokus putih.
  forest: 'on-inverse bg-surface-forest text-text-inverse',
};

export interface SectionProps {
  id: string;
  /** Judul section. Selalu h2 — h1 milik halaman. */
  title: string;
  /** Label kecil di atas judul (mis. "Agenda"). */
  eyebrow?: string;
  description?: string;
  /** Latar bergantian memisahkan section tanpa garis border berulang. */
  surface?: SectionSurface;
  /** Section utama bernapas lebih lega daripada section pendukung. */
  emphasis?: 'primary' | 'secondary';
  /** Tautan "lihat semua" — selalu subordinat terhadap satu aksi utama halaman (P2-3). */
  action?: { label: string; href: string };
  /** Pola kontur topografi tipis di latar. */
  topo?: boolean;
  /** Judul di tengah (untuk section naratif). */
  center?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({
  id,
  title,
  eyebrow,
  description,
  surface = 'canvas',
  emphasis = 'secondary',
  action,
  topo,
  center,
  className,
  children,
}) => {
  const dark = surface === 'forest';
  return (
    <section
      aria-labelledby={`${id}-title`}
      className={cn(
        'relative',
        surfaceClass[surface],
        topo && (dark ? 'topo-inverse' : 'topo'),
        emphasis === 'primary' ? 'civic-section' : 'civic-section-sm',
        className,
      )}
    >
      <div className="civic-container">
        <Reveal
          className={cn(
            'mb-10 flex flex-col gap-5',
            center ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between',
          )}
        >
          <div className={cn(center && 'flex flex-col items-center')}>
            {eyebrow && <p className={cn('eyebrow mb-3', dark && 'text-text-inverse-muted')}>{eyebrow}</p>}
            <h2
              id={`${id}-title`}
              className={cn('font-display text-display-md font-semibold', dark ? 'text-text-inverse' : 'text-text-primary')}
            >
              {title}
            </h2>
            {description && (
              <p className={cn('mt-3 max-w-prose text-base sm:text-lg', dark ? 'text-text-inverse-muted' : 'text-text-secondary')}>
                {description}
              </p>
            )}
          </div>
          {action && (
            <ButtonLink
              href={action.href}
              variant={dark ? 'inverse' : 'outline'}
              size="sm"
              className="group shrink-0 self-start sm:self-auto"
            >
              {action.label}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </ButtonLink>
          )}
        </Reveal>
        {children}
      </div>
    </section>
  );
};

export interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

/** Kepala halaman ringkas (tanpa ilustrasi): satu h1, lede dibatasi lebar baca. */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, className, children }) => (
  <header className={cn('mb-10', className)}>
    <h1 className="font-display text-display-lg font-semibold text-text-primary">{title}</h1>
    {description && <p className="mt-4 max-w-prose text-base text-text-secondary sm:text-lg">{description}</p>}
    {children}
  </header>
);

export interface PageHeroProps {
  title: string;
  eyebrow?: string;
  description?: string;
  /** Suasana lanskap di bagian bawah kepala halaman. */
  scene?: SceneVariant;
  /** Breadcrumb atau elemen di atas judul. */
  top?: React.ReactNode;
  /** Aksi/isi tambahan di bawah deskripsi (tombol, pencarian, statistik ringkas). */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Kepala halaman bergambar: langit + kontur topografi, judul besar, dan pita lanskap
 * yang menyambung ke isi halaman (kanvas). Satu h1 per halaman.
 */
export const PageHero: React.FC<PageHeroProps> = ({ title, eyebrow, description, scene = 'forest', top, children, className }) => (
  <header className={cn('relative overflow-hidden bg-surface-sky', className)}>
    <div className="topo absolute inset-0" aria-hidden="true" />
    <div className="civic-container relative pb-28 pt-8 sm:pb-36 sm:pt-12 lg:pb-44">
      {top}
      <div className="mt-6 max-w-3xl animate-rise">
        {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
        <h1 className="font-display text-display-lg font-semibold text-text-primary">{title}</h1>
        {description && <p className="mt-5 max-w-prose text-lg leading-relaxed text-text-secondary text-pretty">{description}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </div>
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 sm:h-36 lg:h-44">
      <SceneStrip variant={scene} />
    </div>
    {/* Tepi bawah berupa bukit berwarna kanvas: kepala halaman "turun" ke isi tanpa garis lurus. */}
    <Hills className="absolute inset-x-0 -bottom-px text-surface-canvas" phase={1.7} />
  </header>
);
