import type { Metadata } from 'next';
import Link from 'next/link';
import { Download, Search, Upload, UserPlus, Users } from 'lucide-react';
import { golonganEnum, memberStatusEnum, type Golongan, type MemberStatus } from '@/db/schema';
import { Button, ButtonLink, buttonStyles } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input, Select } from '@/components/ui/Field';
import { MemberStatusBadge, Notice, Pagination, Panel, PortalHeader, TableWrap, td, th, withQuery } from '@/components/dashboard/ui';
import { gudepOptions, listMembers, memberStatusCounts } from '@/features/members/queries';
import { can, requirePermission } from '@/lib/auth/session';
import { GOLONGAN_OPTIONS, MEMBER_STATUS_LABELS, ageOn, golonganLabel } from '@/lib/domain';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Anggota' };

type Search = { q?: string; status?: string; golongan?: string; gudep?: string; page?: string; tersimpan?: string };

export default async function AnggotaPage({ searchParams = {} }: { searchParams?: Search }) {
  const user = await requirePermission('members.read');
  const status = (memberStatusEnum.enumValues as string[]).includes(searchParams.status ?? '') ? (searchParams.status as MemberStatus) : undefined;
  const golongan = (golonganEnum.enumValues as string[]).includes(searchParams.golongan ?? '') ? (searchParams.golongan as Golongan) : undefined;
  const q = (searchParams.q ?? '').trim().slice(0, 80) || undefined;
  const gudepId = /^[0-9a-f-]{36}$/i.test(searchParams.gudep ?? '') ? searchParams.gudep : undefined;
  const page = Math.max(1, Number(searchParams.page) || 1);

  const [result, counts, gudeps] = await Promise.all([
    listMembers(user, { q, status, golongan, gudepId, page }),
    memberStatusCounts(user),
    gudepOptions(user),
  ]);
  const current = { q, status, golongan, gudep: gudepId };
  const exportHref = withQuery('/dashboard/anggota/ekspor', current, {});
  const filtered = !!(q || golongan || gudepId);

  const tabs: { label: string; status?: MemberStatus; count: number }[] = [
    { label: 'Semua', count: counts.ACTIVE + counts.PENDING + counts.NEEDS_FIX },
    { label: 'Aktif', status: 'ACTIVE', count: counts.ACTIVE },
    { label: 'Menunggu verifikasi', status: 'PENDING', count: counts.PENDING },
    { label: 'Perlu perbaikan', status: 'NEEDS_FIX', count: counts.NEEDS_FIX },
    { label: 'Arsip', status: 'ARCHIVED', count: counts.ARCHIVED },
  ];

  return (
    <>
      <PortalHeader
        title="Data anggota"
        description="Satu daftar anggota untuk seluruh wilayah Anda. Data yang perlu tindakan tampil paling atas."
        actions={
          <>
            {can(user, 'members.create') && (
              <ButtonLink href="/dashboard/anggota/baru">
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Tambah anggota
              </ButtonLink>
            )}
            {can(user, 'members.import') && (
              <ButtonLink href="/dashboard/anggota/impor" variant="outline">
                <Upload className="h-4 w-4" aria-hidden="true" />
                Impor
              </ButtonLink>
            )}
            {can(user, 'members.export') && (
              <a href={exportHref} className={buttonStyles('ghost', 'md')}>
                <Download className="h-4 w-4" aria-hidden="true" />
                Ekspor CSV
              </a>
            )}
          </>
        }
      />
      {searchParams.tersimpan && <Notice>Perubahan tersimpan.</Notice>}

      {/* Tab status: satu klik ke daftar kerja yang paling sering dipakai */}
      <nav aria-label="Saring menurut status" className="-mx-1 mb-4 overflow-x-auto">
        <ul className="flex min-w-max gap-1 px-1">
          {tabs.map((t) => {
            const active = t.status === status;
            return (
              <li key={t.label}>
                <Link
                  href={withQuery('/dashboard/anggota', { ...current, status: undefined }, { status: t.status })}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex min-h-touch items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors',
                    active ? 'border-action-primary bg-action-primary text-text-on-brand' : 'border-border-subtle bg-surface-base text-text-secondary hover:text-text-primary',
                  )}
                >
                  {t.label}
                  <span className={cn('rounded-pill px-2 text-xs font-bold', active ? 'bg-surface-base text-text-accent' : 'bg-surface-subtle text-text-secondary')}>
                    {t.count.toLocaleString('id-ID')}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Panel bodyClassName="p-0 sm:p-0">
        <form role="search" method="get" action="/dashboard/anggota" className="grid gap-3 border-b border-border-subtle p-4 sm:p-5 md:grid-cols-12">
          {status && <input type="hidden" name="status" value={status} />}
          <div className="relative md:col-span-5">
            <label htmlFor="cari" className="sr-only">
              Cari nama atau nomor KTA
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
            <Input id="cari" name="q" type="search" defaultValue={q} placeholder="Cari nama atau nomor KTA" className="pl-9" maxLength={80} />
          </div>
          <div className="md:col-span-3">
            <label htmlFor="f-golongan" className="sr-only">
              Golongan
            </label>
            <Select id="f-golongan" name="golongan" defaultValue={golongan ?? ''}>
              <option value="">Semua golongan</option>
              {GOLONGAN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          {gudeps.length > 1 ? (
            <div className="md:col-span-3">
              <label htmlFor="f-gudep" className="sr-only">
                Gudep
              </label>
              <Select id="f-gudep" name="gudep" defaultValue={gudepId ?? ''}>
                <option value="">Semua gudep</option>
                {gudeps.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <div className="hidden md:col-span-3 md:block" />
          )}
          <div className="flex gap-2 md:col-span-1">
            <Button type="submit" variant="outline" className="w-full">
              Cari
            </Button>
          </div>
          {filtered && (
            <p className="text-sm text-text-secondary md:col-span-12">
              Menampilkan hasil pencarian.{' '}
              <Link href={withQuery('/dashboard/anggota', { status }, {})} className="font-semibold text-text-accent underline">
                Hapus filter
              </Link>
            </p>
          )}
        </form>

        <div className="px-4 pb-4 sm:px-5">
          {result.rows.length === 0 ? (
            <div className="pt-4">
              <EmptyState
                icon={Users}
                title={filtered ? 'Tidak ada anggota yang cocok' : status ? `Tidak ada data berstatus "${MEMBER_STATUS_LABELS[status]}"` : 'Belum ada data anggota'}
                description={filtered ? 'Periksa ejaan atau hapus filter.' : 'Tambahkan anggota satu per satu atau impor dari Excel.'}
                action={can(user, 'members.create') && !filtered ? { label: 'Tambah anggota', href: '/dashboard/anggota/baru' } : undefined}
              />
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block">
                <TableWrap label="Daftar anggota">
                  <table className="w-full">
                    <caption className="sr-only">Daftar anggota</caption>
                    <thead>
                      <tr className="border-b border-border-subtle">
                        <th scope="col" className={th}>Nama</th>
                        <th scope="col" className={th}>Golongan</th>
                        <th scope="col" className={th}>Gudep</th>
                        <th scope="col" className={th}>Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {result.rows.map((m) => (
                        <tr key={m.id} className="hover:bg-surface-canvas">
                          <td className={td}>
                            <Link href={`/dashboard/anggota/${m.id}`} className="font-semibold text-text-primary hover:text-text-accent hover:underline">
                              {m.fullName}
                            </Link>
                            <p className="text-sm text-text-secondary">
                              {m.kta ? `KTA ${m.kta}` : 'KTA belum terbit'} · {ageOn(m.birthDate)} th · {m.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                            </p>
                          </td>
                          <td className={cn(td, 'text-text-secondary')}>{golonganLabel(m.golongan)}</td>
                          <td className={td}>
                            <p className="text-text-primary">{m.gudepName}</p>
                            <p className="text-sm text-text-secondary">Kwarran {m.kwarranName}</p>
                          </td>
                          <td className={td}>
                            <MemberStatusBadge status={m.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableWrap>
              </div>

              {/* Ponsel */}
              <ul className="divide-y divide-border-subtle md:hidden">
                {result.rows.map((m) => (
                  <li key={m.id} className="relative py-4">
                    <Link href={`/dashboard/anggota/${m.id}`} className="stretched-link font-semibold text-text-primary">
                      {m.fullName}
                    </Link>
                    <p className="text-sm text-text-secondary">
                      {golonganLabel(m.golongan)} · {m.gudepName}
                    </p>
                    <div className="mt-2">
                      <MemberStatusBadge status={m.status} />
                    </div>
                  </li>
                ))}
              </ul>

              <Pagination
                page={result.page}
                pageCount={result.pageCount}
                total={result.total}
                unit="anggota"
                hrefFor={(p) => withQuery('/dashboard/anggota', current, { page: p })}
              />
            </>
          )}
        </div>
      </Panel>
    </>
  );
}
