import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MemberForm } from '@/components/dashboard/members/MemberForm';
import { PortalHeader } from '@/components/dashboard/ui';
import { updateMemberAction } from '@/features/members/actions';
import { getMember, gudepOptions } from '@/features/members/queries';
import { can, requirePermission } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Ubah data anggota' };

export default async function UbahAnggotaPage({ params }: { params: { id: string } }) {
  const user = await requirePermission('members.update');
  const [row, gudeps] = await Promise.all([getMember(user, params.id), gudepOptions(user)]);
  if (!row || row.m.status === 'ARCHIVED') notFound();
  const { m } = row;
  const sensitive = can(user, 'members.view_sensitive');

  return (
    <>
      <PortalHeader
        title={`Ubah data: ${m.fullName}`}
        description={
          can(user, 'members.verify')
            ? 'Perubahan langsung berlaku dan tercatat di riwayat.'
            : 'Setelah disimpan, data akan kembali diperiksa staf Kwarran.'
        }
        back={{ href: `/dashboard/anggota/${m.id}`, label: 'Kembali ke detail anggota' }}
      />
      <div className="max-w-3xl">
        <MemberForm
          action={updateMemberAction.bind(null, m.id)}
          gudepOptions={gudeps.map((g) => ({ value: g.id, label: `${g.name}${g.number ? ` (${g.number})` : ''}` }))}
          defaults={{
            ...m,
            // Kolom sensitif tidak dikirim ke peramban pengguna yang tidak berhak melihatnya.
            phone: sensitive ? m.phone : null,
            address: sensitive ? m.address : null,
          }}
          cancelHref={`/dashboard/anggota/${m.id}`}
          submitLabel="Simpan perubahan"
          needsVerification={!can(user, 'members.verify')}
          showSensitive={sensitive}
        />
      </div>
    </>
  );
}
