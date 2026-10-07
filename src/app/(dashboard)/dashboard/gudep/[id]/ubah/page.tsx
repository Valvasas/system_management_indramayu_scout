import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GudepForm } from '@/components/dashboard/gudep/GudepForm';
import { PortalHeader } from '@/components/dashboard/ui';
import { updateGudepAction } from '@/features/gudep/actions';
import { getGudep, kwarranOptions } from '@/features/gudep/queries';
import { can, requirePermission } from '@/lib/auth/session';
import { getDb, schema } from '@/db';
import { asc } from 'drizzle-orm';

export const metadata: Metadata = { title: 'Ubah gudep' };

export default async function UbahGudepPage({ params }: { params: { id: string } }) {
  const user = await requirePermission('gudep.update');
  const row = await getGudep(user, params.id);
  if (!row) notFound();
  const canRestructure = can(user, 'gudep.create');
  // Staf gudep hanya perlu label kwarrannya (dikunci), bukan seluruh daftar.
  const kwarrans = canRestructure
    ? await kwarranOptions(user)
    : await (
        await getDb()
      )
        .select({ id: schema.kwarran.id, name: schema.kwarran.name })
        .from(schema.kwarran)
        .orderBy(asc(schema.kwarran.name));

  return (
    <>
      <PortalHeader title={`Ubah: ${row.g.name}`} back={{ href: `/dashboard/gudep/${row.g.id}`, label: 'Kembali ke detail gudep' }} />
      <div className="max-w-3xl">
        <GudepForm
          action={updateGudepAction.bind(null, row.g.id)}
          kwarranOptions={kwarrans.map((k) => ({ value: k.id, label: k.name }))}
          defaults={row.g}
          canRestructure={canRestructure}
          isNew={false}
          cancelHref={`/dashboard/gudep/${row.g.id}`}
          submitLabel="Simpan perubahan"
        />
      </div>
    </>
  );
}
