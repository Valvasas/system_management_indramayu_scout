import React from 'react';
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowLeftRight,
  ArrowRight,
  BellRing,
  CalendarClock,
  Check,
  CheckCheck,
  CircleDot,
  ClipboardList,
  FileCheck2,
  Globe,
  Info,
  KeyRound,
  Megaphone,
  PenLine,
  Undo2,
  type LucideIcon,
} from 'lucide-react';
import { ActionButton } from '@/components/dashboard/ConfirmButton';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import type { NotificationKind, NotificationPriority, notifications } from '@/db/schema';
import { openNotificationAction } from '@/features/notifications/actions';
import { NOTIFICATION_KIND_LABELS, PRIORITY_LABELS } from '@/features/notifications/labels';
import { formatDate, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';

type NotificationRow = typeof notifications.$inferSelect;

const KIND_ICONS: Record<NotificationKind, LucideIcon> = {
  ANNOUNCEMENT: Megaphone,
  NEWS_REVIEW: PenLine,
  NEWS_RETURNED: Undo2,
  NEWS_PUBLISHED: Globe,
  TRANSFER_REQUESTED: ArrowLeftRight,
  TRANSFER_DECIDED: ArrowLeftRight,
  ACCESS_REQUEST: KeyRound,
  CONSENT_DECIDED: FileCheck2,
  EVENT_REGISTRATION: ClipboardList,
  TERM_ENDING: CalendarClock,
  SYSTEM: Info,
};

const PRIORITY_STYLE: Record<NotificationPriority, { tone: BadgeTone; icon: LucideIcon }> = {
  HIGH: { tone: 'warning', icon: AlertTriangle },
  NORMAL: { tone: 'neutral', icon: BellRing },
  LOW: { tone: 'neutral', icon: ArrowDownCircle },
};

export const PriorityBadge: React.FC<{ priority: NotificationPriority }> = ({ priority }) => (
  <Badge tone={PRIORITY_STYLE[priority].tone} icon={PRIORITY_STYLE[priority].icon} className="whitespace-nowrap">
    {PRIORITY_LABELS[priority]}
  </Badge>
);

/**
 * Daftar notifikasi milik pengguna (data sudah dibatasi ke pemiliknya di server).
 * Status belum dibaca & prioritas selalu ikon + teks, tidak hanya warna.
 */
export const NotificationList: React.FC<{ items: NotificationRow[]; page: number; filter: string }> = ({ items, page, filter }) => (
  <ul className="divide-y divide-border-subtle">
    {items.map((n) => {
      const Icon = KIND_ICONS[n.kind];
      const unread = !n.readAt;
      const created = n.createdAt.toISOString();
      return (
        <li key={n.id} className={cn('flex gap-4 px-5 py-4 sm:px-6', unread && 'bg-surface-subtle')}>
          <span
            className={cn(
              'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-pill',
              unread ? 'bg-surface-meadow text-text-accent' : 'bg-surface-subtle text-text-secondary',
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {unread ? (
                <Badge tone="info" icon={CircleDot} className="whitespace-nowrap">
                  Belum dibaca
                </Badge>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary">
                  <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Sudah dibaca
                </span>
              )}
              <PriorityBadge priority={n.priority} />
              <span className="text-xs text-text-secondary">{NOTIFICATION_KIND_LABELS[n.kind].label}</span>
            </div>
            <h3 className={cn('mt-1.5 break-words text-base text-text-primary', unread ? 'font-semibold' : 'font-medium')}>{n.title}</h3>
            {n.body && <p className="mt-0.5 break-words text-sm text-text-secondary">{n.body}</p>}
            <p className="mt-1 text-xs text-text-secondary">
              <time dateTime={created}>
                {formatDate(created)}, {formatTime(created)}
              </time>
            </p>
            {(unread || n.href) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {unread ? (
                  <ActionButton
                    action={openNotificationAction.bind(null, n.id, page, filter)}
                    label={`${n.href ? 'Buka dan tandai dibaca' : 'Tandai dibaca'}: ${n.title}`}
                  >
                    {n.href ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
                    {n.href ? 'Buka dan tandai dibaca' : 'Tandai dibaca'}
                  </ActionButton>
                ) : n.href ? (
                  <ButtonLink href={n.href} variant="ghost" size="sm" aria-label={`Buka: ${n.title}`}>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    Buka
                  </ButtonLink>
                ) : null}
              </div>
            )}
          </div>
        </li>
      );
    })}
  </ul>
);
