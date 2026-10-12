import type { Metadata } from 'next';
import Link from 'next/link';
import { Award, Download, Plus } from 'lucide-react';
import { golonganEnum, type CompetencyKind, type Golongan } from '@/db/schema';
import { RequirementActiveBadge } from '@/components/dashboard/competency/CompetencyBadges';
import { Notice, Pagination, Panel, PortalHeader, TableWrap, td, th, withQuery } from '@/components/dashboard/ui';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Field';
import { listRequirements, requirementLevels } from '@/features/competency/competency';
import { KIND_LABELS, REQUIREMENT_STATUS_OPTIONS, type RequirementStatusFilter } from '@/features/competency/labels';
import { gudepOptions } from '@/features/members/queries';
import { requirePermission } from '@/lib/auth/session';
import { GOLONGAN_OPTIONS, golonganLabel } from '@/lib/domain';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Syarat SKU/SKK' };

type Search = { golongan?: string; jenis?: string; tingkatan?: string; status?: string; halaman?: string; tersimpan?: string };

const SAVED: Record<string, string> = {
  baru: 'Syarat baru tersimpan.',
  ubah: 'Perubahan syarat tersimpan.',
};

const STATUS_VALUES = REQUIREMENT_STATUS_OPTIONS.map((o) => o.value) as readonly string[];

/**
 * Data referensi SKU/SKK (competency.manage — tingkat Kwarcab). Filter lewat formulir GET biasa
 * (berfungsi tanpa JavaScript). Ekspor rekap kemajuan memakai route handler terpisah yang
 * menegakkan izin + cakupan sendiri.
 */
export default async function SkuPage({ searchParams = {} }: { searchParams?: Search }) {
  const user = await requirePermission('competency.manage');
  const golongan = (golonganEnum.enumValues as string[]).includes(searchParams.golongan ?? '')
    ? (searchParams.golongan as Golongan)
    : undefined;
  const kind = searchParams.jenis === 'SKU' || searchParams.jenis === 'SKK' ? (searchParams.jenis as CompetencyKind) : undefined;
  const status = STATUS_VALUES.includes(searchParams.status ?? '') ? (searchParams.status as RequirementStatusFilter) : 'aktif';
  const page = Math.max(1, Math.floor(Number(searchParams.halaman)) || 1);

  const [levels, gudeps] = await Promise.all([requirementLevels(user, { golongan, kind }), gudepOptions(user)]);
  const level = searchParams.tingkatan && levels.includes(searchParams.tingkatan) ? searchParams.tingkatan : undefined;
  const result = await listRequirements(user, { golongan, kind, level, status, page });

  const current = { golongan, jenis: kind, tingkatan: level, status: status === 'aktif' ? undefined : status };
  const filtered = Boolean(golongan || kind || level || status !== 'aktif');

  return (
    <>
      <PortalHeader
        title="Syarat SKU/SKK"
        description="Daftar syarat kecakapan per golongan yang diverifikasi pembina di halaman detail anggota. Syarat nonaktif tidak dihitung dalam kemajuan."
        actions={
          <ButtonLink href="/dashboard/sku/baru">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tambah syarat
          </ButtonLink>
        }
      />
      {searchParams.tersimpan && SAVED[searchParams.tersimpan] && <Notice>{SAVED[searchParams.tersimpan]}</Notice>}
      <Notice tone="info">
        Teks syarat wajib diketik apa adanya dari dokumen resmi Kwarnas. Data contoh berkode DEMO- hanya penanda tempat, ganti sebelum
        dipakai.
      </Notice>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <Panel bodyClassName="p-0 sm:p-0">
            <form
              role="search"
              method="get"
              action="/dashboard/sku"
              aria-label="Saring daftar syarat"
              className="grid gap-3 border-b border-border-subtle p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-5"
            >
              <div>
                <label htmlFor="sku-golongan" className="mb-1 block text-sm font-medium text-text-primary">
                  Golongan
                </label>
                <Select id="sku-golongan" name="golongan" defaultValue={golongan ?? ''}>
                  <option value="">Semua golongan</option>
                  {GOLONGAN_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label htmlFor="sku-jenis" className="mb-1 block text-sm font-medium text-text-primary">
                  Jenis
                </label>
                <Select id="sku-jenis" name="jenis" defaultValue={kind ?? ''}>
                  <option value="">SKU & SKK</option>
                  <option value="SKU">SKU</option>
                  <option value="SKK">SKK</option>
                </Select>
              </div>
              <div>
                <label htmlFor="sku-tingkatan" className="mb-1 block text-sm font-medium text-text-primary">
                  Tingkatan
                </label>
                <Select id="sku-tingkatan" name="tingkatan" defaultValue={level ?? ''}>
                  <option value="">Semua tingkatan</option>
                  {levels.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label htmlFor="sku-status" className="mb-1 block text-sm font-medium text-text-primary">
                  Status
                </label>
                <Select id="sku-status" name="status" defaultValue={status}>
                  {REQUIREMENT_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex items-end">
                <Button type="submit" variant="outline" className="w-full">
                  Terapkan
                </Button>
              </div>
              {filtered && (
                <p className="text-sm text-text-secondary sm:col-span-2 xl:col-span-5">
                  Menampilkan hasil saringan.{' '}
                  <Link href="/dashboard/sku" className="font-semibold text-text-accent underline">
                    Hapus saringan
                  </Link>
                </p>
              )}
            </form>

            <div className="px-5 pb-4 sm:px-6">
              {result.rows.length === 0 ? (
                <div className="pt-4">
                  <EmptyState
                    variant="icon"
                    icon={Award}
                    title={filtered ? 'Tidak ada syarat yang cocok' : 'Belum ada syarat SKU/SKK'}
                    description={
                      filtered
                        ? 'Ubah atau hapus saringan untuk melihat syarat lain.'
                        : 'Tambahkan syarat per golongan dan tingkatan dari dokumen resmi Kwarnas.'
                    }
                    action={filtered ? undefined : { label: 'Tambah syarat', href: '/dashboard/sku/baru' }}
                  />
                </div>
              ) : (
                <>
                  <TableWrap label="Daftar syarat SKU/SKK">
                    <table className="w-full min-w-[44rem] text-base">
                      <caption className="sr-only">Daftar syarat SKU/SKK</caption>
                      <thead className="border-b border-border-subtle">
                        <tr>
                          <th scope="col" className={th}>
                            Syarat
                          </th>
                          <th scope="col" className={th}>
                            Golongan
                          </th>
                          <th scope="col" className={th}>
                            Jenis · tingkatan
                          </th>
                          <th scope="col" className={th}>
                            Urutan
                          </th>
                          <th scope="col" className={th}>
                            Status
                          </th>
                          <th scope="col" className={th}>
                            Terverifikasi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        {result.rows.map((row) => (
                          <tr key={row.id}>
                            <td className={td}>
                              <p className="text-xs font-semibold tracking-wide text-text-secondary">{row.code}</p>
                              <Link
                                href={`/dashboard/sku/${row.id}`}
                                className="inline-flex min-h-touch max-w-md items-center font-semibold text-text-primary hover:underline"
                              >
                                <span className="line-clamp-2 break-words">{row.title}</span>
                              </Link>
                            </td>
                            <td className={td}>{golonganLabel(row.golongan)}</td>
                            <td className={td}>
                              {KIND_LABELS[row.kind]} · {row.level}
                            </td>
                            <td className={cn(td, 'tabular-nums')}>{row.sortOrder}</td>
                            <td className={td}>
                              <RequirementActiveBadge active={row.active} />
                            </td>
                            <td className={cn(td, 'tabular-nums')}>{row.verifiedCount.toLocaleString('id-ID')} anggota</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TableWrap>
                  <Pagination
                    page={result.page}
                    pageCount={result.pageCount}
                    total={result.total}
                    unit="syarat"
                    hrefFor={(p) => withQuery('/dashboard/sku', current, { halaman: p > 1 ? p : undefined })}
                  />
                </>
              )}
            </div>
          </Panel>
        </div>

        <div className="min-w-0">
          <Panel
            id="rekap"
            title="Rekap kemajuan"
            description="CSV per anggota per tingkatan: KTA, nama, gudep, jumlah terverifikasi. Tanpa kontak, alamat, data wali, maupun catatan pembina. Unduhan tercatat di log."
          >
            <form method="get" action="/dashboard/sku/ekspor" className="space-y-3">
              <div>
                <label htmlFor="rekap-gudep" className="mb-1 block text-sm font-medium text-text-primary">
                  Gudep
                </label>
                <Select id="rekap-gudep" name="gudep" defaultValue="">
                  <option value="">Semua gudep dalam cakupan</option>
                  {gudeps.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} — {g.kwarranName}
                    </option>
                  ))}
                </Select>
              </div>
              <Button type="submit" variant="outline" className="w-full">
                <Download className="h-4 w-4" aria-hidden="true" />
                Unduh CSV
              </Button>
            </form>
          </Panel>
        </div>
      </div>
    </>
  );
}
