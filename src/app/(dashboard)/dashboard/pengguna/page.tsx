import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Search, UserPlus, XCircle } from 'lucide-react';
import { roleEnum, type Role } from '@/db/schema';
import { Badge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { Notice, Panel, PortalHeader, TableWrap, td, th } from '@/components/dashboard/ui';
import { listUsers } from '@/features/users/queries';
import { ROLE_LABELS } from '@/lib/auth/permissions';
import { requirePermission } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Pengguna & akses' };

export default async function PenggunaPage({ searchParams = {} }: { searchParams?: { q?: string; peran?: string; tersimpan?: string } }) {
  await requirePermission('users.manage');
  const role = (roleEnum.enumValues as string[]).includes(searchParams.peran ?? '') ? (searchParams.peran as Role) : undefined;
  const q = (searchParams.q ?? '').trim().slice(0, 80) || undefined;
  const users = await listUsers({ q, role });

  return (
    <>
      <PortalHeader
        title="Pengguna & akses"
        description="Akun staf dan pengurus. Akun peserta dibuat dari halaman detail anggota."
        actions={
          <ButtonLink href="/dashboard/pengguna/baru">
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Buat akun staf
          </ButtonLink>
        }
      />
      {searchParams.tersimpan && <Notice>Perubahan akun tersimpan.</Notice>}

      <Panel bodyClassName="p-0 sm:p-0">
        <form
          role="search"
          method="get"
          action="/dashboard/pengguna"
          className="grid gap-3 border-b border-border-subtle p-4 sm:p-5 md:grid-cols-12"
        >
          <div className="relative md:col-span-6">
            <label htmlFor="cari-akun" className="sr-only">
              Cari nama atau nama pengguna
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
            <Input id="cari-akun" name="q" type="search" defaultValue={q} placeholder="Cari nama atau nama pengguna" className="pl-9" />
          </div>
          <div className="md:col-span-4">
            <label htmlFor="f-peran" className="sr-only">
              Peran
            </label>
            <Select id="f-peran" name="peran" defaultValue={role ?? ''}>
              <option value="">Semua peran</option>
              {roleEnum.enumValues.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="outline" className="md:col-span-2">
            Cari
          </Button>
        </form>
        <div className="px-4 pb-4 sm:px-5">
          <TableWrap label="Daftar akun">
            <table className="w-full">
              <caption className="sr-only">Daftar akun</caption>
              <thead>
                <tr className="border-b border-border-subtle">
                  <th scope="col" className={th}>
                    Nama
                  </th>
                  <th scope="col" className={th}>
                    Peran & cakupan
                  </th>
                  <th scope="col" className={th}>
                    Terakhir masuk
                  </th>
                  <th scope="col" className={th}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-canvas">
                    <td className={td}>
                      {u.role === 'PESERTA' ? (
                        <span className="font-semibold text-text-primary">{u.name}</span>
                      ) : (
                        <Link
                          href={`/dashboard/pengguna/${u.id}`}
                          className="font-semibold text-text-primary hover:text-text-accent hover:underline"
                        >
                          {u.name}
                        </Link>
                      )}
                      <p className="text-sm text-text-secondary">{u.username}</p>
                    </td>
                    <td className={td}>
                      <p className="text-text-primary">{ROLE_LABELS[u.role]}</p>
                      <p className="text-sm text-text-secondary">
                        {u.kwarranName
                          ? `Kwarran ${u.kwarranName}`
                          : (u.gudepName ?? (u.role === 'SUPER_ADMIN' || u.role === 'ADMIN_KWARCAB' ? 'Seluruh kabupaten' : '—'))}
                      </p>
                    </td>
                    <td className={`${td} whitespace-nowrap text-text-secondary`}>
                      {u.lastLoginAt ? formatDate(u.lastLoginAt.toISOString()) : 'Belum pernah'}
                    </td>
                    <td className={td}>
                      {u.active ? (
                        <Badge tone="success" icon={CheckCircle2}>
                          Aktif
                        </Badge>
                      ) : (
                        <Badge tone="neutral" icon={XCircle}>
                          Nonaktif
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
          <p className="mt-3 text-sm text-text-secondary">{users.length} akun</p>
        </div>
      </Panel>
    </>
  );
}
