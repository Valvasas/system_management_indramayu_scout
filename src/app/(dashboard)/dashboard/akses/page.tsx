import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { KeyRound, ShieldCheck, X } from 'lucide-react';
import { ActionButton } from '@/components/dashboard/ConfirmButton';
import { IssueCodeForm } from '@/components/dashboard/users/IssueCodeForm';
import { Notice, Panel, PortalHeader } from '@/components/dashboard/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import { dismissResetRequestAction, issueResetCodeAction } from '@/features/auth/access-actions';
import { openResetRequestsFor } from '@/features/auth/access-codes';
import { ROLE_LABELS } from '@/lib/auth/permissions';
import { can, requireUser } from '@/lib/auth/session';
import { formatDate, formatTime } from '@/lib/format';

export const metadata: Metadata = { title: 'Permintaan akses' };

export default async function AksesPage({ searchParams = {} }: { searchParams?: { diabaikan?: string } }) {
  const user = await requireUser();
  if (!can(user, 'users.create_peserta') && !can(user, 'users.manage')) notFound();
  const requests = await openResetRequestsFor(user);

  return (
    <>
      <PortalHeader
        title="Permintaan akses"
        description="Anggota atau staf yang lupa kata sandi meminta bantuan lewat halaman masuk. Pastikan identitasnya (tatap muka atau lewat orang tua/wali), lalu buat kode akses sekali pakai."
      />
      {searchParams.diabaikan && <Notice>Permintaan diabaikan.</Notice>}

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title={`Menunggu (${requests.length})`} className="lg:col-span-2">
          {requests.length === 0 ? (
            <EmptyState
              variant="icon"
              icon={KeyRound}
              title="Tidak ada permintaan"
              description="Permintaan lupa kata sandi dari anggota dalam cakupan Anda akan muncul di sini."
            />
          ) : (
            <ul className="divide-y divide-border-subtle">
              {requests.map((r) => (
                <li key={r.id} className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-text-primary">{r.name}</p>
                    <p className="text-sm text-text-secondary">
                      {r.username} · {ROLE_LABELS[r.role]}
                      {r.gudepName ? ` · ${r.gudepName}` : ''}
                    </p>
                    {r.note && (
                      <p className="mt-2 rounded-xl bg-surface-subtle px-3 py-2 text-sm text-text-primary">&ldquo;{r.note}&rdquo;</p>
                    )}
                    <p className="mt-1 text-xs text-text-muted">
                      Diminta {formatDate(r.createdAt.toISOString())}, {formatTime(r.createdAt.toISOString())}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                    <IssueCodeForm action={issueResetCodeAction.bind(null, r.userId)} />
                    <ActionButton
                      action={dismissResetRequestAction.bind(null, r.id)}
                      variant="ghost"
                      confirm={`Abaikan permintaan dari ${r.name}?`}
                      label={`Abaikan permintaan ${r.name}`}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                      Abaikan
                    </ActionButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Cara aman menyerahkan kode">
          <ul className="space-y-3 text-sm text-text-secondary">
            {[
              'Pastikan Anda bicara dengan pemilik akun atau orang tua/walinya.',
              'Serahkan kode secara langsung atau lewat pesan pribadi, jangan di grup.',
              'Kode hanya berlaku sekali dan kedaluwarsa dalam 24 jam.',
              'Anda tidak pernah perlu (dan tidak bisa) mengetahui kata sandi anggota.',
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-text-accent" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
