import type { Metadata } from 'next';
import { GudepForm } from '@/components/dashboard/gudep/GudepForm';
import { PortalHeader } from '@/components/dashboard/ui';
import { createGudepAction } from '@/features/gudep/actions';
import { kwarranOptions } from '@/features/gudep/queries';
import { requirePermission } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Tambah gudep' };

export default async function TambahGudepPage() {
  const user = await requirePermission('gudep.create');
  const kwarrans = await kwarranOptions(user);
  return (
    <>
      <PortalHeader title="Tambah gudep" back={{ href: '/dashboard/gudep', label: 'Kembali ke daftar gudep' }} />
      <div className="max-w-3xl">
        <GudepForm
          action={createGudepAction}
          kwarranOptions={kwarrans.map((k) => ({ value: k.id, label: k.name }))}
          canRestructure
          isNew
          cancelHref="/dashboard/gudep"
          submitLabel="Simpan gudep"
        />
      </div>
    </>
  );
}
