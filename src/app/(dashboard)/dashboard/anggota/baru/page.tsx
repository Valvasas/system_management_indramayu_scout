import type { Metadata } from 'next';
import { MemberForm } from '@/components/dashboard/members/MemberForm';
import { PortalHeader } from '@/components/dashboard/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import { createMemberAction } from '@/features/members/actions';
import { gudepOptions } from '@/features/members/queries';
import { can, requirePermission } from '@/lib/auth/session';
import { Building2 } from 'lucide-react';

export const metadata: Metadata = { title: 'Tambah anggota' };

export default async function TambahAnggotaPage() {
  const user = await requirePermission('members.create');
  const gudeps = await gudepOptions(user);

  return (
    <>
      <PortalHeader
        title="Tambah anggota"
        description="Kolom bertanda * wajib diisi. Data anak di bawah 18 tahun wajib disertai persetujuan orang tua/wali."
        back={{ href: '/dashboard/anggota', label: 'Kembali ke daftar anggota' }}
      />
      {gudeps.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Belum ada gudep di wilayah Anda"
          description="Anggota harus terdaftar di sebuah gudep. Tambahkan gudep terlebih dahulu."
          action={can(user, 'gudep.create') ? { label: 'Tambah gudep', href: '/dashboard/gudep/baru' } : undefined}
        />
      ) : (
        <div className="max-w-3xl">
          <MemberForm
            action={createMemberAction}
            gudepOptions={gudeps.map((g) => ({ value: g.id, label: `${g.name}${g.number ? ` (${g.number})` : ''}` }))}
            cancelHref="/dashboard/anggota"
            submitLabel="Simpan anggota"
            needsVerification={!can(user, 'members.verify')}
            showSensitive={can(user, 'members.view_sensitive')}
          />
        </div>
      )}
    </>
  );
}
