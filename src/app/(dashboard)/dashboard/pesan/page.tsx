import type { Metadata } from 'next';
import { desc } from 'drizzle-orm';
import { Check, Inbox, Mail, Trash2 } from 'lucide-react';
import { getDb, schema } from '@/db';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionButton } from '@/components/dashboard/ConfirmButton';
import { Notice, PortalHeader } from '@/components/dashboard/ui';
import { deleteMessageAction, markMessageReadAction } from '@/features/site/actions';
import { requirePermission } from '@/lib/auth/session';
import { formatDate, formatTime } from '@/lib/format';

export const metadata: Metadata = { title: 'Pesan masuk' };

export default async function PesanPage({ searchParams }: { searchParams?: { dihapus?: string } }) {
  await requirePermission('messages.read');
  const db = await getDb();
  const rows = await db.select().from(schema.contactMessages).orderBy(desc(schema.contactMessages.createdAt)).limit(200);

  return (
    <>
      <PortalHeader title="Pesan masuk" description="Pesan dari formulir Kontak di situs publik. Balas lewat pos-el pengirim." />
      {searchParams?.dihapus && <Notice>Pesan dihapus.</Notice>}
      {rows.length === 0 ? (
        <EmptyState icon={Inbox} title="Belum ada pesan" description="Pesan dari formulir Kontak akan muncul di sini." />
      ) : (
        <ul className="space-y-4">
          {rows.map((m) => (
            <li
              key={m.id}
              className={`rounded-lg border bg-surface-base p-5 shadow-sm ${m.readAt ? 'border-border-subtle' : 'border-border-brand'}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-text-primary">
                    {m.name}
                    {m.organization ? <span className="font-normal text-text-secondary"> · {m.organization}</span> : null}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {formatDate(m.createdAt.toISOString())}, {formatTime(m.createdAt.toISOString())}
                  </p>
                </div>
                {!m.readAt && (
                  <Badge tone="info" icon={Mail}>
                    Belum dibaca
                  </Badge>
                )}
              </div>
              <p className="mt-3 whitespace-pre-line text-text-primary">{m.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={`mailto:${m.email}?subject=${encodeURIComponent('Balasan dari Kwarcab Indramayu')}`}
                  className="inline-flex min-h-touch items-center gap-2 rounded-lg bg-action-primary px-3 text-sm font-semibold text-text-on-brand hover:bg-action-primary-hover"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  Balas ke {m.email}
                </a>
                {!m.readAt && (
                  <ActionButton action={markMessageReadAction.bind(null, m.id)}>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Tandai sudah dibaca
                  </ActionButton>
                )}
                <ActionButton action={deleteMessageAction.bind(null, m.id)} variant="ghost" confirm={`Hapus pesan dari ${m.name}?`}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Hapus
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
