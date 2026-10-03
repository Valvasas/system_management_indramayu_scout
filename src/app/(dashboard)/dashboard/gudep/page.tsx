import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, MapPin, MapPinOff, Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input, Select } from '@/components/ui/Field';
import { GudepMapCanvas } from '@/components/maps/GudepMapCanvas';
import { Notice, Pagination, Panel, PortalHeader, TableWrap, td, th, withQuery } from '@/components/dashboard/ui';
import { gudepLocationCoverage, gudepMapPoints, kwarranOptions, listGudep } from '@/features/gudep/queries';
import { scopeLevel } from '@/lib/auth/scope';
import { can, requirePermission } from '@/lib/auth/session';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Gudep & lokasi' };

type Search = { q?: string; kwarran?: string; lokasi?: string; page?: string; tersimpan?: string };

export default async function GudepPage({ searchParams = {} }: { searchParams?: Search }) {
  const user = await requirePermission('gudep.read');
  const q = (searchParams.q ?? '').trim().slice(0, 80) || undefined;
  const kwarranId = /^[0-9a-f-]{36}$/i.test(searchParams.kwarran ?? '') ? searchParams.kwarran : undefined;
  const lokasi = searchParams.lokasi === 'tanpa' || searchParams.lokasi === 'ada' ? searchParams.lokasi : undefined;
  const page = Math.max(1, Number(searchParams.page) || 1);
  const wide = scopeLevel(user) === 'KABUPATEN';

  const [result, points, coverage, kwarrans] = await Promise.all([
    listGudep(user, { q, kwarranId, lokasi, page }),
    gudepMapPoints(user, kwarranId),
    gudepLocationCoverage(user),
    wide ? kwarranOptions(user) : Promise.resolve([]),
  ]);
  const current = { q, kwarran: kwarranId, lokasi };
  const missing = coverage.total - coverage.located;

  return (
    <>
      <PortalHeader
        title="Gudep & lokasi"
        description="Data gugus depan beserta titik lokasinya. Klik penanda di peta untuk membuka detail gudep."
        actions={
          can(user, 'gudep.create') ? (
            <ButtonLink href="/dashboard/gudep/baru">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Tambah gudep
            </ButtonLink>
          ) : undefined
        }
      />
      {searchParams.tersimpan && <Notice>Data gudep tersimpan.</Notice>}

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <div className="h-96 overflow-hidden rounded-lg border border-border-subtle bg-surface-base shadow-sm lg:col-span-2">
          <GudepMapCanvas points={points} label={`Peta sebaran ${points.length} gudep`} />
        </div>
        <Panel title="Kelengkapan lokasi">
          <p className="font-display text-3xl font-bold text-text-primary">
            {coverage.located}
            <span className="text-lg font-medium text-text-secondary"> / {coverage.total}</span>
          </p>
          <p className="text-text-secondary">gudep aktif sudah bertitik lokasi</p>
          <div className="mt-3 h-2 overflow-hidden rounded-pill bg-surface-sunken" aria-hidden="true">
            <div className="h-full rounded-pill bg-action-primary" style={{ width: `${coverage.total ? Math.round((coverage.located / coverage.total) * 100) : 0}%` }} />
          </div>
          {missing > 0 ? (
            <Link
              href={withQuery('/dashboard/gudep', { kwarran: kwarranId }, { lokasi: 'tanpa' })}
              className="mt-4 inline-flex min-h-touch items-center gap-2 font-semibold text-text-accent hover:underline"
            >
              <MapPinOff className="h-4 w-4" aria-hidden="true" />
              Lengkapi {missing} gudep tanpa lokasi
            </Link>
          ) : (
            <p className="mt-4 text-sm text-status-success-text">Semua gudep aktif sudah memiliki titik lokasi.</p>
          )}
        </Panel>
      </div>

      <Panel bodyClassName="p-0 sm:p-0">
        <form role="search" method="get" action="/dashboard/gudep" className="grid gap-3 border-b border-border-subtle p-4 sm:p-5 md:grid-cols-12">
          <div className="relative md:col-span-5">
            <label htmlFor="cari-gudep" className="sr-only">
              Cari nama, nomor, atau pangkalan
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
            <Input id="cari-gudep" name="q" type="search" defaultValue={q} placeholder="Cari nama, nomor, atau pangkalan" className="pl-9" />
          </div>
          {wide ? (
            <div className="md:col-span-3">
              <label htmlFor="f-kwarran" className="sr-only">
                Kwarran
              </label>
              <Select id="f-kwarran" name="kwarran" defaultValue={kwarranId ?? ''}>
                <option value="">Semua kwarran</option>
                {kwarrans.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name}
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <div className="hidden md:col-span-3 md:block" />
          )}
          <div className="md:col-span-3">
            <label htmlFor="f-lokasi" className="sr-only">
              Lokasi
            </label>
            <Select id="f-lokasi" name="lokasi" defaultValue={lokasi ?? ''}>
              <option value="">Semua lokasi</option>
              <option value="ada">Sudah bertitik</option>
              <option value="tanpa">Belum bertitik</option>
            </Select>
          </div>
          <Button type="submit" variant="outline" className="md:col-span-1">
            Cari
          </Button>
        </form>

        <div className="px-4 pb-4 sm:px-5">
          {result.rows.length === 0 ? (
            <div className="pt-4">
              <EmptyState
                icon={Building2}
                title="Tidak ada gudep yang cocok"
                description="Ubah pencarian atau filter."
                action={{ label: 'Tampilkan semua', href: '/dashboard/gudep' }}
              />
            </div>
          ) : (
            <>
              <TableWrap label="Daftar gudep">
                <table className="w-full">
                  <caption className="sr-only">Daftar gudep</caption>
                  <thead>
                    <tr className="border-b border-border-subtle">
                      <th scope="col" className={th}>Gudep</th>
                      <th scope="col" className={th}>Kwarran</th>
                      <th scope="col" className={cn(th, 'text-right')}>Anggota aktif</th>
                      <th scope="col" className={th}>Lokasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {result.rows.map((g) => (
                      <tr key={g.id} className="hover:bg-surface-canvas">
                        <td className={td}>
                          <Link href={`/dashboard/gudep/${g.id}`} className="font-semibold text-text-primary hover:text-text-accent hover:underline">
                            {g.name}
                          </Link>
                          <p className="text-sm text-text-secondary">
                            {g.number ?? 'Nomor belum diisi'}
                            {g.jenjang ? ` · ${g.jenjang}` : ''}
                            {!g.active ? ' · Nonaktif' : ''}
                          </p>
                        </td>
                        <td className={cn(td, 'whitespace-nowrap text-text-secondary')}>{g.kwarranName}</td>
                        <td className={cn(td, 'text-right')}>
                          <span className="font-semibold text-text-primary">{g.activeMembers}</span>
                          {g.pendingMembers > 0 && <p className="text-sm text-text-secondary">+{g.pendingMembers} menunggu</p>}
                        </td>
                        <td className={td}>
                          {g.lat !== null ? (
                            <Badge tone="success" icon={MapPin} className="whitespace-nowrap">Ada titik</Badge>
                          ) : (
                            <Badge tone="warning" icon={MapPinOff} className="whitespace-nowrap">Belum ada</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
              <Pagination page={result.page} pageCount={result.pageCount} total={result.total} unit="gudep" hrefFor={(p) => withQuery('/dashboard/gudep', current, { page: p })} />
            </>
          )}
        </div>
      </Panel>
    </>
  );
}
