import React from 'react';
import { CheckCircle2, CircleDashed, CircleOff, Undo2, type LucideIcon } from 'lucide-react';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import type { ProgressItem } from '@/features/competency/progress';

type VerificationState = 'verified' | 'revoked' | 'none';

const VISUALS: Record<VerificationState, { tone: BadgeTone; icon: LucideIcon; label: string }> = {
  verified: { tone: 'success', icon: CheckCircle2, label: 'Terverifikasi' },
  revoked: { tone: 'warning', icon: Undo2, label: 'Dibatalkan' },
  none: { tone: 'neutral', icon: CircleDashed, label: 'Belum' },
};

export const verificationState = (item: Pick<ProgressItem, 'verified' | 'revoked'>): VerificationState =>
  item.verified ? 'verified' : item.revoked ? 'revoked' : 'none';

/** Status satu syarat: ikon + teks (tidak pernah warna saja). */
export function VerificationBadge({ item }: { item: Pick<ProgressItem, 'verified' | 'revoked'> }) {
  const v = VISUALS[verificationState(item)];
  return (
    <Badge tone={v.tone} icon={v.icon} className="whitespace-nowrap">
      {v.label}
    </Badge>
  );
}

/** Status data referensi syarat: Aktif / Nonaktif. */
export function RequirementActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge tone="success" icon={CheckCircle2} className="whitespace-nowrap">
      Aktif
    </Badge>
  ) : (
    <Badge tone="neutral" icon={CircleOff} className="whitespace-nowrap">
      Nonaktif
    </Badge>
  );
}
