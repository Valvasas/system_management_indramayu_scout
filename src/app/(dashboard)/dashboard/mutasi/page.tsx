import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeftRight, ArrowRight, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { ActionButton } from '@/components/dashboard/ConfirmButton';
import { TransferDecisionForm } from '@/components/dashboard/members/TransferForms';
import { Notice, Panel, PortalHeader } from '@/components/dashboard/ui';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { cancelTransferAction, decideTransferAction } from '@/features/members/transfer-actions';
import { transfersAwaitingDecision, transfersOutgoing, transfersRecent } from '@/features/members/transfers';
import { can, requirePermission } from '@/lib/auth/session';
import { golonganLabel } from '@/lib/domain';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Mutasi anggota' };

const STATUS = {
  APPROVED: { label: 'Disetujui', tone: 'success', icon: CheckCircle2 },
  REJECTED: { label: 'Ditolak', tone: 'danger', icon: XCircle },
  CANCELLED: { label: 'Dibatalkan', tone: 'neutral', icon: XCircle },
  REQUESTED: { label: 'Menunggu', tone: 'info', icon: Clock },
} as const;

const Route: React.FC<{ from: string; to: string }> = ({ from, to }) => (
  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-text-secondary">
    <span>{from}</span>
    <ArrowRight className="h-4 w-4 text-text-accent" aria-hidden="true" />
    <span className="sr-only">ke</span>
    <span className="font-medium text-text-primary">{to}</span>
  </p>
);

export default async function MutasiPage({ searchParams = {} }: { searchParams?: { keputusan?: string } }) {
  const user = await requirePermission('members.update');
  const [awaiting, outgoing, recent] = await Promise.all([transfersAwaitingDecision(user), transfersOutgoing(user), transfersRecent(user)]);
  const canDecide = can(user, 'members.verify');

  return (
    <>
      <PortalHeader
        title="Mutasi anggota"
        description="Perpindahan anggota antar-gudep. Pengajuan dibuat dari halaman detail anggota; pengurus wilayah tujuan menyetujui. Riwayat gudep anggota tetap tersimpan."
      />
      {searchParams.keputusan === 'setuju' && <Notice>Mutasi disetujui. Anggota sudah berpindah ke gudep tujuan.</Notice>}
      {searchParams.keputusan === 'tolak' && <Notice>Mutasi ditolak. Pengaju dapat melihat alasan Anda.</Notice>}

      <div className="grid gap-6 lg:grid-cols-2">
        {canDecide && (
          <Panel title={`Menunggu keputusan Anda (${awaiting.length})`} className="lg:col-span-2">
            {awaiting.length === 0 ? (
              <EmptyState variant="icon" icon={ArrowLeftRight} title="Tidak ada pengajuan masuk" description="Pengajuan mutasi ke gudep di wilayah Anda akan muncul di sini." />
            ) : (
              <ul className="grid gap-4 md:grid-cols-2">
                {awaiting.map(({ t, memberName, golongan, fromName, toName }) => (
                  <li key={t.id} className="rounded-2xl border border-border-subtle p-5">
                    <p className="font-semibold text-text-primary">
                      <Link href={`/dashboard/anggota/${t.memberId}`} className="hover:underline">
                        {memberName}
                      </Link>{' '}
                      <span className="font-normal text-text-secondary">· {golonganLabel(golongan)}</span>
                    </p>
                    <Route from={fromName} to={toName} />
                    <p className="mt-3 rounded-xl bg-surface-subtle px-3 py-2 text-sm text-text-primary">{t.reason}</p>
                    <p className="mt-2 text-xs text-text-muted">
                      Diajukan {t.requestedByName} · {formatDate(t.createdAt.toISOString())}
                    </p>
                    <div className="mt-4">
                      <TransferDecisionForm action={decideTransferAction.bind(null, t.id)} id={t.id} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}

        <Panel title={`Diajukan dari wilayah Anda (${outgoing.length})`}>
          {outgoing.length === 0 ? (
            <p className="text-sm text-text-secondary">Tidak ada pengajuan yang sedang menunggu.</p>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {outgoing.map(({ t, memberName, fromName, toName }) => (
                <li key={t.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-text-primary">{memberName}</p>
                    <Route from={fromName} to={toName} />
                    <p className="mt-1 text-xs text-text-muted">{formatDate(t.createdAt.toISOString())}</p>
                  </div>
                  <ActionButton action={cancelTransferAction.bind(null, t.id)} variant="ghost" confirm={`Batalkan pengajuan mutasi ${memberName}?`} label={`Batalkan mutasi ${memberName}`}>
                    Batalkan
                  </ActionButton>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Keputusan terbaru">
          {recent.length === 0 ? (
            <p className="text-sm text-text-secondary">Belum ada riwayat mutasi di wilayah Anda.</p>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {recent.map(({ t, memberName, fromName, toName }) => {
                const s = STATUS[t.status];
                return (
                  <li key={t.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-text-primary">{memberName}</p>
                      <Badge tone={s.tone} icon={s.icon}>
                        {s.label}
                      </Badge>
                    </div>
                    <Route from={fromName} to={toName} />
                    <p className="mt-1 text-xs text-text-muted">
                      {t.decidedByName ?? '—'} · {t.decidedAt ? formatDate(t.decidedAt.toISOString()) : ''}
                      {t.decisionNote ? ` · “${t.decisionNote}”` : ''}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
