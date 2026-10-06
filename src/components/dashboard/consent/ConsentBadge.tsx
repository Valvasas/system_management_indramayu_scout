import { AlertTriangle, Ban, CheckCircle2, Clock, XCircle, type LucideIcon } from 'lucide-react';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import type { ConsentStatusKind } from '@/features/consent/status';

const MAP: Record<ConsentStatusKind, { tone: BadgeTone; icon: LucideIcon; label: string }> = {
  GRANTED: { tone: 'success', icon: CheckCircle2, label: 'Disetujui wali' },
  LEGACY: { tone: 'warning', icon: AlertTriangle, label: 'Manual, belum terverifikasi' },
  DECLINED: { tone: 'neutral', icon: XCircle, label: 'Tidak disetujui' },
  REVOKED: { tone: 'danger', icon: Ban, label: 'Dicabut' },
  NONE: { tone: 'neutral', icon: Clock, label: 'Belum ada' },
};

export const CONSENT_KIND_LABELS = Object.fromEntries(Object.entries(MAP).map(([k, v]) => [k, v.label])) as Record<
  ConsentStatusKind,
  string
>;

/** Status persetujuan: ikon + teks (bukan warna saja). */
export function ConsentBadge({ kind }: { kind: ConsentStatusKind }) {
  const m = MAP[kind];
  return (
    <Badge tone={m.tone} icon={m.icon} className="whitespace-nowrap">
      {m.label}
    </Badge>
  );
}
