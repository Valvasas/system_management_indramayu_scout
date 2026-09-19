import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ButtonLink } from './Button';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Aksi lanjut. Empty state tanpa jalan keluar hanya jalan buntu yang sopan. */
  action?: { label: string; href: string };
  className?: string;
}

/**
 * Keadaan kosong yang jujur: ikon + penjelasan + aksi lanjut.
 * Menggantikan kotak abu bisu dan grid kosong tanpa keterangan (P2-5, P4-4).
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface-subtle px-6 py-12 text-center',
      className,
    )}
  >
    <Icon className="h-10 w-10 text-text-muted" aria-hidden="true" />
    <p className="mt-4 text-base font-semibold text-text-primary">{title}</p>
    <p className="mt-1 max-w-prose text-sm text-text-secondary">{description}</p>
    {action && (
      <ButtonLink href={action.href} variant="outline" size="sm" className="mt-5">
        {action.label}
      </ButtonLink>
    )}
  </div>
);
