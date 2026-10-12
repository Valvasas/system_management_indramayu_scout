import { AlarmClock, CheckCircle2, Clock, History, XCircle, type LucideIcon } from 'lucide-react';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import type { TermState } from '@/features/terms/dates';
import { TERM_BADGE_LABELS, termBadgeKind, type TermBadgeKind } from '@/features/terms/labels';

const VISUALS: Record<TermBadgeKind, { tone: BadgeTone; icon: LucideIcon }> = {
  ACTIVE: { tone: 'success', icon: CheckCircle2 },
  ENDING: { tone: 'warning', icon: AlarmClock },
  UPCOMING: { tone: 'info', icon: Clock },
  ENDED: { tone: 'neutral', icon: History },
  DEACTIVATED: { tone: 'neutral', icon: XCircle },
};

/** Status masa jabatan: ikon + teks (tidak pernah warna saja). */
export function TermStateBadge({ state, isActive }: { state: TermState; isActive: boolean }) {
  const kind = termBadgeKind({ state, isActive });
  const v = VISUALS[kind];
  return (
    <Badge tone={v.tone} icon={v.icon} className="whitespace-nowrap">
      {TERM_BADGE_LABELS[kind]}
    </Badge>
  );
}
