import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Clock, FileEdit, MessageSquareWarning, PenLine, Plus, Trash2 } from 'lucide-react';
import { ActionButton } from '@/components/dashboard/ConfirmButton';
import { Notice, Panel, PortalHeader } from '@/components/dashboard/ui';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { deleteContributionAction } from '@/features/content/contributions';
import { listOwnNews } from '@/features/content/queries';
import { requirePermission } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Tulis berita' };

type Search = { tersimpan?: string; terkirim?: string; dihapus?: string };

export default async function KontribusiPage({ searchParams = {} }: { searchParams?: Search }) {
  const user = await requirePermission('content.contribute');
  const rows = await listOwnNews(user.id);

  return (
    <>
      <PortalHeader
        title="Tulis berita"
        description="Bagikan kabar kegiatan gudep atau wilayah Anda. Editor Kwarcab memeriksa setiap berita sebelum tayang di situs."
        actions={
          <ButtonLink href="/dashboard/kontribusi/baru">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tulis berita
          </ButtonLink>
        }
      />
      {searchParams.terkirim && <Notice>Berita terkirim ke editor. Anda akan melihat statusnya berubah di sini.</Notice>}
      {searchParams.tersimpan && <Notice>Draf tersimpan.</Notice>}
      {searchParams.dihapus && <Notice>Draf dihapus.</Notice>}

      <Panel>
        {rows.length === 0 ? (
          <EmptyState
            variant="icon"
            icon={PenLine}
            title="Belum ada tulisan"
            description="Mulai dari kegiatan terakhir gudep Anda: apa, kapan, di mana, dan apa yang dipelajari."
            action={{ label: 'Tulis berita pertama', href: '/dashboard/kontribusi/baru' }}
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {rows.map((n) => {
              const returned = n.status === 'DRAFT' && n.reviewNote;
              const editable = n.status === 'DRAFT' || n.status === 'REVIEW';
              return (
                <li key={n.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {editable ? (
                        <Link href={`/dashboard/kontribusi/${n.id}`} className="font-semibold text-text-primary hover:underline">
                          {n.title}
                        </Link>
                      ) : n.status === 'PUBLISHED' ? (
                        <Link href={`/berita/${n.slug}`} className="font-semibold text-text-primary hover:underline">
                          {n.title}
                        </Link>
                      ) : (
                        <span className="font-semibold text-text-primary">{n.title}</span>
                      )}
                      {n.status === 'PUBLISHED' && (
                        <Badge tone="success" icon={CheckCircle2}>
                          Tayang
                        </Badge>
                      )}
                      {n.status === 'REVIEW' && (
                        <Badge tone="info" icon={Clock}>
                          Menunggu review
                        </Badge>
                      )}
                      {returned && (
                        <Badge tone="warning" icon={MessageSquareWarning}>
                          Perlu perbaikan
                        </Badge>
                      )}
                      {n.status === 'DRAFT' && !returned && (
                        <Badge tone="neutral" icon={FileEdit}>
                          Draf
                        </Badge>
                      )}
                    </div>
                    {returned && (
                      <p className="mt-2 rounded-xl bg-status-warning-surface px-3 py-2 text-sm text-status-warning-text">
                        Catatan editor: {n.reviewNote}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-text-secondary">
                      {n.category} · diubah {formatDate(n.updatedAt.toISOString())}
                    </p>
                  </div>
                  {n.status === 'DRAFT' && (
                    <ActionButton
                      action={deleteContributionAction.bind(null, n.id)}
                      variant="ghost"
                      confirm={`Hapus draf "${n.title}"?`}
                      label={`Hapus draf ${n.title}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Hapus
                    </ActionButton>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
