import React, { HTMLAttributes } from 'react';
import {
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  FileText,
  FileType,
  LucideIcon,
  PlayCircle,
  Tag,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgendaStatus } from '@/types';

export type BadgeTone = 'brand' | 'info' | 'success' | 'warning' | 'danger' | 'neutral';

const tones: Record<BadgeTone, string> = {
  brand: 'bg-status-success-surface text-status-success-text border-status-success-border',
  info: 'bg-status-info-surface text-status-info-text border-status-info-border',
  success: 'bg-status-success-surface text-status-success-text border-status-success-border',
  warning: 'bg-status-warning-surface text-status-warning-text border-status-warning-border',
  danger: 'bg-status-danger-surface text-status-danger-text border-status-danger-border',
  neutral: 'bg-status-neutral-surface text-status-neutral-text border-status-neutral-border',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Ikon lucide. Selalu dirender bersama teks, tidak pernah menggantikannya. */
  icon?: LucideIcon;
}

/**
 * Label status/kategori. Warna tidak pernah jadi satu-satunya pembawa makna
 * (WCAG 1.4.1): setiap badge membawa teks, dan badge status membawa ikon.
 */
export const Badge: React.FC<BadgeProps> = ({
  className,
  tone = 'neutral',
  icon: Icon,
  children,
  ...props
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-xs font-medium',
      tones[tone],
      className,
    )}
    {...props}
  >
    {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
    {children}
  </span>
);

/* ---------------- Peta status domain ---------------- */

const agendaStatus: Record<AgendaStatus, { label: string; tone: BadgeTone; icon: LucideIcon }> = {
  UPCOMING: { label: 'Akan Datang', tone: 'info', icon: Clock },
  ONGOING: { label: 'Sedang Berlangsung', tone: 'success', icon: PlayCircle },
  COMPLETED: { label: 'Selesai', tone: 'neutral', icon: CheckCircle2 },
  CANCELLED: { label: 'Dibatalkan', tone: 'danger', icon: XCircle },
};

export const agendaStatusLabel = (status: AgendaStatus) => agendaStatus[status].label;

export const AgendaStatusBadge: React.FC<{ status: AgendaStatus; className?: string }> = ({
  status,
  className,
}) => {
  const s = agendaStatus[status];
  return (
    <Badge tone={s.tone} icon={s.icon} className={className}>
      {s.label}
    </Badge>
  );
};

const fileIcons: Record<string, LucideIcon> = {
  PDF: FileType,
  DOCX: FileText,
  XLSX: FileSpreadsheet,
};

export const FileTypeBadge: React.FC<{ type: string; className?: string }> = ({
  type,
  className,
}) => (
  <Badge tone="neutral" icon={fileIcons[type.toUpperCase()] ?? FileText} className={className}>
    {type.toUpperCase()}
  </Badge>
);

export const CategoryBadge: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <Badge tone="brand" icon={Tag} className={className}>
    {children}
  </Badge>
);
