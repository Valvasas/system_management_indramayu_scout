import type { Metadata } from 'next';
import Link from 'next/link';
import { and, asc, count, eq, gt, ilike, ne, sql, type SQL } from 'drizzle-orm';
import { Clock, FileCheck2, Search } from 'lucide-react';
import { getDb, schema } from '@/db';
import { ConsentBadge } from '@/components/dashboard/consent/ConsentBadge';
import { InfoList, Pagination, Panel, PortalHeader, TableWrap, td, th, withQuery } from '@/components/dashboard/ui';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChips } from '@/components/ui/FilterChips';
import { Input } from '@/components/ui/Field';
import { consentStatusesFor, minorBirthCutoff, openRequestsFor } from '@/features/consent/consent';
import { CONSENT_SCOPE_LABELS, CONSENT_SCOPES } from '@/features/consent/texts';
import { memberScope } from '@/lib/auth/scope';
import { requirePermission } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Persetujuan wali' };

const PAGE = 50;

/** Persetujuan wali terverifikasi untuk satu cakupan (keputusan terbaru: setuju lewat kode wali). */
const verified = (scope: string) =>
  sql`coalesce((SELECT c.granted AND c.method = 'GUARDIAN_CODE' FROM guardian_consents c
      WHERE c.member_id = ${schema.members.id} AND c.scope = ${scope} ORDER BY c.decided_at DESC LIMIT 1), false)`;

export default async function PersetujuanPage({ searchParams = {} }: { searchParams?: { status?: string; q?: string; page?: string } }) {
  const user = await requirePermission('members.read');
  const status = ['perlu', 'lengkap'].includes(searchParams.status ?? '') ? searchParams.status! : 'semua';
  const q = (searchParams.q ?? '').trim().slice(0, 80) || undefined;
  const page = Math.max(1, Number(searchParams.page) || 1);

  // Hanya anak (< 18 tahun) yang masih tercatat aktif dalam cakupan pengguna.
  const base: (SQL | undefined)[] = [
    memberScope(user),
    gt(schema.members.birthDate, minorBirthCutoff()),
    ne(schema.members.status, 'ARCHIVED'),
  ];
  const conds = [...base];
  if (q) conds.push(ilike(schema.members.fullName, `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`));
  if (status === 'perlu') conds.push(sql`NOT ${verified('DATA')}`);
  if (status === 'lengkap') conds.push(and(...CONSENT_SCOPES.map((s) => verified(s))));

  const db = await getDb();
  const from = () => db.select({ n: count() }).from(schema.members).innerJoin(schema.gudep, eq(schema.gudep.id, schema.members.gudepId));
  const [rows, [{ n: total }], [{ n: minors }], [{ n: dataOk }]] = await Promise.all([
    db
      .select({ id: schema.members.id, fullName: schema.members.fullName, gudepName: schema.gudep.name })
      .from(schema.members)
      .innerJoin(schema.gudep, eq(schema.gudep.id, schema.members.gudepId))
      .where(and(...conds))
      .orderBy(asc(schema.members.fullName))
      .limit(PAGE)
      .offset((page - 1) * PAGE),
    from().where(and(...conds)),
    from().where(and(...base)),
    from().where(and(...base, verified('DATA'))),
  ]);
  const ids = rows.map((r) => r.id);
  const [statuses, open] = await Promise.all([consentStatusesFor(ids), openRequestsFor(ids)]);
  const current = { status: status === 'semua' ? undefined : status, q };

  return (
    <>
      <PortalHeader
        title="Persetujuan wali"
        description="Anggota di bawah 18 tahun dan status persetujuan orang tua/wali. Persetujuan diberikan wali sendiri memakai kode sekali pakai yang dibuat di halaman anggota."
      />
      <div className="grid gap-6 lg:grid-cols-4">
        <Panel title="Ringkasan" className="lg:col-span-1">
          <InfoList
            columns={1}
            items={[
              { label: 'Anggota di bawah 18 tahun', value: minors.toLocaleString('id-ID') },
              { label: 'Data pribadi disetujui wali', value: dataOk.toLocaleString('id-ID') },
              { label: 'Perlu tindakan', value: (minors - dataOk).toLocaleString('id-ID') },
            ]}
          />
        </Panel>
        <Panel bodyClassName="p-0 sm:p-0" className="lg:col-span-3">
          <div className="space-y-4 border-b border-border-subtle p-4 sm:p-5">
            <FilterChips
              label="Saring status persetujuan"
              param="status"
              active={status}
              options={[
                { value: 'semua', label: 'Semua' },
                { value: 'perlu', label: 'Perlu tindakan' },
                { value: 'lengkap', label: 'Lengkap' },
              ]}
            />
            <form role="search" method="get" action="/dashboard/persetujuan" className="flex gap-2">
              {status !== 'semua' && <input type="hidden" name="status" value={status} />}
              <label htmlFor="cari-persetujuan" className="sr-only">
                Cari nama anggota
              </label>
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                  aria-hidden="true"
                />
                <Input id="cari-persetujuan" name="q" type="search" defaultValue={q} placeholder="Cari nama anggota" className="pl-9" />
              </div>
              <Button type="submit" variant="secondary">
                Cari
              </Button>
            </form>
          </div>
          {rows.length === 0 ? (
            <div className="p-6">
              <EmptyState
                variant="icon"
                icon={FileCheck2}
                title={status === 'perlu' ? 'Tidak ada yang perlu ditindaklanjuti' : 'Tidak ada anggota yang cocok'}
                description="Anggota di bawah 18 tahun dalam wilayah Anda akan tampil di sini."
              />
            </div>
          ) : (
            <TableWrap label="Daftar persetujuan wali">
              <table className="w-full min-w-[720px]">
                <caption className="sr-only">Status persetujuan wali per anggota</caption>
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th scope="col" className={`${th} pl-5`}>
                      Anggota
                    </th>
                    {CONSENT_SCOPES.map((s) => (
                      <th key={s} scope="col" className={th}>
                        {CONSENT_SCOPE_LABELS[s]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const st = statuses.get(r.id)!;
                    return (
                      <tr key={r.id} className="border-b border-border-subtle last:border-0">
                        <td className={`${td} pl-5`}>
                          <Link
                            href={`/dashboard/anggota/${r.id}`}
                            className="font-semibold text-text-primary underline-offset-2 hover:underline"
                          >
                            {r.fullName}
                          </Link>
                          <p className="text-sm text-text-secondary">{r.gudepName}</p>
                          {open.has(r.id) && (
                            <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
                              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                              Kode terkirim, menunggu wali
                            </p>
                          )}
                        </td>
                        {CONSENT_SCOPES.map((s) => (
                          <td key={s} className={td}>
                            <ConsentBadge kind={st[s].kind} />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
          )}
          <div className="p-4 sm:p-5">
            <Pagination
              page={page}
              pageCount={Math.max(1, Math.ceil(total / PAGE))}
              total={total}
              unit="anggota"
              hrefFor={(p) => withQuery('/dashboard/persetujuan', current, { page: p })}
            />
          </div>
        </Panel>
      </div>
    </>
  );
}
