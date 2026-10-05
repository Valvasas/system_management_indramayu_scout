import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyCamp } from '@/components/illustrations/Scenes';
import { ButtonLink } from './Button';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Aksi lanjut. Empty state tanpa jalan keluar hanya jalan buntu yang sopan. */
  action?: { label: string; href: string };
  /** `scene` = ilustrasi perkemahan (halaman publik & ruang lega); `icon` = ringkas (panel portal). */
  variant?: 'scene' | 'icon';
  className?: string;
}

/**
 * Keadaan kosong yang jujur dan ramah: ilustrasi + penjelasan + aksi lanjut.
 * Menggantikan kotak abu bisu dan grid kosong tanpa keterangan (P2-5, P4-4).
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action, variant = 'scene', className }) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface-base px-6 text-center',
      variant === 'scene' ? 'py-10' : 'py-8',
      className,
    )}
  >
    {variant === 'scene' ? (
      <div className="relative h-24 w-40 overflow-hidden rounded-xl">
        <EmptyCamp />
        <span className="absolute bottom-1.5 right-1.5 flex h-8 w-8 items-center justify-center rounded-pill bg-surface-base text-text-accent shadow-sm">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    ) : (
      <span className="flex h-12 w-12 items-center justify-center rounded-pill bg-surface-meadow text-text-accent">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
    )}
    <p className="mt-5 font-display text-xl font-semibold text-text-primary">{title}</p>
    <p className="mt-1.5 max-w-prose text-sm text-text-secondary">{description}</p>
    {action && (
      <ButtonLink href={action.href} variant="outline" size="sm" className="mt-5">
        {action.label}
      </ButtonLink>
    )}
  </div>
);
