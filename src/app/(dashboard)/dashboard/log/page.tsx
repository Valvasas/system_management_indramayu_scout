import type { Metadata } from 'next';
import { and, count, desc, gte, ilike, or, type SQL } from 'drizzle-orm';
import { Search } from 'lucide-react';
import { getDb, schema } from '@/db';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { Pagination, Panel, PortalHeader, TableWrap, td, th, withQuery } from '@/components/dashboard/ui';
import { requirePermission } from '@/lib/auth/session';
import { formatDate, formatTime } from '@/lib/format';

export const metadata: Metadata = { title: 'Log aktivitas' };

const PAGE = 50;
const RANGES: Record<string, { label: string; days: number }> = {
  '7': { label: '7 hari terakhir', days: 7 },
  '30': { label: '30 hari terakhir', days: 30 },
  '365': { label: '1 tahun terakhir', days: 365 },
};

export default async function LogPage({ searchParams = {} }: { searchParams?: { q?: string; rentang?: string; page?: string } }) {
  await requirePermission('audit.view');
  const q = (searchParams.q ?? '').trim().slice(0, 80) || undefined;
  const rentang = RANGES[searchParams.rentang ?? ''] ? searchParams.rentang! : '30';
  const page = Math.max(1, Number(searchParams.page) || 1);

  const conds: (SQL | undefined)[] = [gte(schema.auditLogs.at, new Date(Date.now() - RANGES[rentang].days * 86400_000))];
  if (q) {
    const like = `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
    conds.push(or(ilike(schema.auditLogs.actorName, like), ilike(schema.auditLogs.summary, like), ilike(schema.auditLogs.action, like)));
  }
  const where = and(...conds);
  const db = await getDb();
  const [rows, [{ total }]] = await Promise.all([
    db.select().from(schema.auditLogs).where(where).orderBy(desc(schema.auditLogs.at)).limit(PAGE).offset((page - 1) * PAGE),
    db.select({ total: count() }).from(schema.auditLogs).where(where),
  ]);

  return (
    <>
      <PortalHeader
        title="Log aktivitas"
        description="Catatan otomatis: siapa melakukan apa dan kapan. Tidak dapat diubah atau dihapus dari portal."
      />
      <Panel bodyClassName="p-0 sm:p-0">
        <form role="search" method="get" action="/dashboard/log" className="grid gap-3 border-b border-border-subtle p-4 sm:p-5 md:grid-cols-12">
          <div className="relative md:col-span-6">
            <label htmlFor="cari-log" className="sr-only">
              Cari pelaku atau aktivitas
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
            <Input id="cari-log" name="q" type="search" defaultValue={q} placeholder="Cari pelaku atau aktivitas, mis. ekspor" className="pl-9" />
          </div>
          <div className="md:col-span-4">
            <label htmlFor="f-rentang" className="sr-only">
              Rentang waktu
            </label>
            <Select id="f-rentang" name="rentang" defaultValue={rentang}>
              {Object.entries(RANGES).map(([v, r]) => (
                <option key={v} value={v}>
                  {r.label}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="outline" className="md:col-span-2">
            Terapkan
          </Button>
        </form>
        <div className="px-4 pb-4 sm:px-5">
          <TableWrap label="Log aktivitas">
            <table className="w-full">
              <caption className="sr-only">Log aktivitas</caption>
              <thead>
                <tr className="border-b border-border-subtle">
                  <th scope="col" className={th}>Waktu</th>
                  <th scope="col" className={th}>Pelaku</th>
                  <th scope="col" className={th}>Aktivitas</th>
                  <th scope="col" className={th}>IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {rows.map((l) => (
                  <tr key={l.id}>
                    <td className={`${td} whitespace-nowrap text-sm text-text-secondary`}>
                      {formatDate(l.at.toISOString())}
                      <br />
                      {formatTime(l.at.toISOString())}
                    </td>
                    <td className={`${td} font-medium text-text-primary`}>{l.actorName}</td>
                    <td className={td}>
                      <p className="text-text-primary">{l.summary}</p>
                      <p className="font-mono text-xs text-text-muted">{l.action}</p>
                    </td>
                    <td className={`${td} font-mono text-xs text-text-secondary`}>{l.ip ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
          <Pagination page={page} pageCount={Math.max(1, Math.ceil(total / PAGE))} total={total} unit="catatan" hrefFor={(p) => withQuery('/dashboard/log', { q, rentang }, { page: p })} />
        </div>
      </Panel>
    </>
  );
}
