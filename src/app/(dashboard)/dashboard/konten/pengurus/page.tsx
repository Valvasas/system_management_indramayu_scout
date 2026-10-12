import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlarmClock, Plus, Trash2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionButton } from '@/components/dashboard/ConfirmButton';
import { TermStateBadge } from '@/components/dashboard/terms/TermStateBadge';
import { Notice, Panel, PortalHeader, TableWrap, td, th } from '@/components/dashboard/ui';
import { deleteBoardMemberAction } from '@/features/content/organization';
import { boardOverview, type BoardMemberWithTerm } from '@/features/terms/board';
import { TERM_REMINDER_DAYS } from '@/features/terms/dates';
import { daysLeftLabel, termRangeLabel } from '@/features/terms/labels';
import { requirePermission } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Pengurus' };

function BoardTable({ rows, caption }: { rows: BoardMemberWithTerm[]; caption: string }) {
  return (
    <TableWrap label={caption}>
      <table className="w-full min-w-[48rem] text-base">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-border-subtle">
          <tr>
            <th scope="col" className={th}>
              Nama
            </th>
            <th scope="col" className={th}>
              Jabatan
            </th>
            <th scope="col" className={th}>
              Bidang
            </th>
            <th scope="col" className={th}>
              Masa jabatan
            </th>
            <th scope="col" className={th}>
              Status
            </th>
            <th scope="col" className={th}>
              <span className="sr-only">Aksi</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {rows.map((b) => (
            <tr key={b.id}>
              <td className={td}>
                <Link
                  href={`/dashboard/konten/pengurus/${b.id}`}
                  className="inline-flex min-h-touch items-center font-semibold text-text-primary hover:underline"
                >
                  {b.name}
                </Link>
              </td>
              <td className={td}>{b.position}</td>
              <td className={td}>{b.department}</td>
              <td className={td}>
                <span className="block">{termRangeLabel(b.termStart, b.termEnd)}</span>
                <span className="block text-sm text-text-secondary">Masa bakti {b.period}</span>
              </td>
              <td className={td}>
                <TermStateBadge state={b.state} isActive={b.isActive} />
              </td>
              <td className={td}>
                <ActionButton
                  action={deleteBoardMemberAction.bind(null, b.id)}
                  variant="ghost"
                  confirm={`Hapus ${b.name} dari daftar pengurus? Untuk menyimpan riwayat, isi tanggal berakhir saja.`}
                  label={`Hapus pengurus ${b.name}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Hapus
                </ActionButton>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

export default async function PengurusAdminPage({ searchParams = {} }: { searchParams?: { tersimpan?: string; dihapus?: string } }) {
  const actor = await requirePermission('content.manage');
  const overview = await boardOverview(actor);
  if (!overview) notFound();
  const { current, ending, past } = overview;

  return (
    <>
      <PortalHeader
        title="Pengurus"
        back={{ href: '/dashboard/konten', label: 'Konten situs' }}
        description="Pengurus yang sedang menjabat tampil di halaman Struktur Organisasi, dikelompokkan per bidang dan diurutkan menurut angka urutan."
        actions={
          <ButtonLink href="/dashboard/konten/pengurus/baru">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tambah pengurus
          </ButtonLink>
        }
      />
      {searchParams.tersimpan && <Notice>Data pengurus tersimpan.</Notice>}
      {searchParams.dihapus && <Notice>Data pengurus dihapus.</Notice>}

      <div className="space-y-6">
        {ending.length > 0 && (
          <Panel
            id="hampir-berakhir"
            title="Jabatan hampir berakhir"
            description={`Masa jabatan berakhir dalam ${TERM_REMINDER_DAYS} hari ke depan. Perbarui data bila ada pergantian pengurus.`}
          >
            <ul className="divide-y divide-border-subtle">
              {ending.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <Link
                      href={`/dashboard/konten/pengurus/${b.id}`}
                      className="inline-flex min-h-touch items-center font-semibold text-text-primary hover:underline"
                    >
                      {b.name}
                    </Link>
                    <p className="text-sm text-text-secondary">
                      {b.position} · berakhir {formatDate(b.termEnd!)}
                    </p>
                  </div>
                  <Badge tone="warning" icon={AlarmClock} className="whitespace-nowrap">
                    {daysLeftLabel(b.daysLeft ?? 0)}
                  </Badge>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        <Panel
          id="menjabat"
          title="Sedang menjabat"
          description="Termasuk pengurus yang masa jabatannya belum mulai (belum tampil di situs publik)."
        >
          {current.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Belum ada pengurus yang menjabat"
              description="Tambahkan susunan pengurus periode berjalan agar tampil di situs publik."
            />
          ) : (
            <BoardTable rows={current} caption="Pengurus Kwarcab yang sedang menjabat" />
          )}
        </Panel>

        <Panel
          id="riwayat-periode"
          title="Riwayat periode"
          description="Pengurus yang masa jabatannya sudah berakhir atau dinonaktifkan. Tidak tampil di situs publik."
        >
          {past.length === 0 ? (
            <p className="text-text-secondary">Belum ada riwayat periode sebelumnya.</p>
          ) : (
            <BoardTable rows={past} caption="Riwayat periode pengurus Kwarcab" />
          )}
        </Panel>
      </div>
    </>
  );
}
