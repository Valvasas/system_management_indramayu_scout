import type { Metadata } from 'next';
import Link from 'next/link';
import { Notice, Panel, PortalHeader, TableWrap, td, th } from '@/components/dashboard/ui';
import { getKwarran } from '@/lib/repositories';
import { requirePermission } from '@/lib/auth/session';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Kwarran' };

export default async function KwarranPage({ searchParams }: { searchParams?: { tersimpan?: string } }) {
  await requirePermission('kwarran.manage');
  const rows = await getKwarran();
  const incomplete = rows.filter((k) => !k.code || !k.leader).length;

  return (
    <>
      <PortalHeader
        title="Kwartir Ranting"
        description="31 kwarran sesuai kecamatan di Kabupaten Indramayu. Lengkapi kode, ketua, dan alamat sekretariat masing-masing."
      />
      {searchParams?.tersimpan && <Notice>Data kwarran tersimpan.</Notice>}
      {incomplete > 0 && <Notice tone="warning">{incomplete} kwarran belum lengkap (kode atau nama ketua kosong).</Notice>}

      <Panel>
        <TableWrap label="Daftar kwarran">
          <table className="w-full">
            <caption className="sr-only">Daftar kwarran</caption>
            <thead>
              <tr className="border-b border-border-subtle">
                <th scope="col" className={th}>
                  Kwarran
                </th>
                <th scope="col" className={th}>
                  Ketua
                </th>
                <th scope="col" className={cn(th, 'text-right')}>
                  Gudep aktif
                </th>
                <th scope="col" className={cn(th, 'text-right')}>
                  Anggota aktif
                </th>
                <th scope="col" className={th}>
                  <span className="sr-only">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {rows.map((k) => (
                <tr key={k.id} className="hover:bg-surface-canvas">
                  <td className={td}>
                    <p className="font-semibold text-text-primary">{k.name}</p>
                    <p className="text-sm text-text-secondary">{k.code || 'Kode belum diisi'}</p>
                  </td>
                  <td className={cn(td, 'text-text-secondary')}>{k.leader || '—'}</td>
                  <td className={cn(td, 'text-right')}>
                    <Link href={`/dashboard/gudep?kwarran=${k.id}`} className="font-semibold text-text-accent hover:underline">
                      {k.gudepCount}
                    </Link>
                  </td>
                  <td className={cn(td, 'text-right font-semibold text-text-primary')}>{k.activeMembers.toLocaleString('id-ID')}</td>
                  <td className={cn(td, 'text-right')}>
                    <Link
                      href={`/dashboard/kwarran/${k.id}`}
                      className="inline-flex min-h-touch items-center rounded-lg px-2 font-semibold text-text-accent hover:underline"
                    >
                      Ubah<span className="sr-only"> data Kwarran {k.name}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Panel>
    </>
  );
}
