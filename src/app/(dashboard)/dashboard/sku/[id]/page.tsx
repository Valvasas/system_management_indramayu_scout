import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CircleOff, RotateCcw } from 'lucide-react';
import { ActionButton } from '@/components/dashboard/ConfirmButton';
import { RequirementActiveBadge } from '@/components/dashboard/competency/CompetencyBadges';
import { RequirementForm } from '@/components/dashboard/competency/RequirementForm';
import { InfoList, Notice, Panel, PortalHeader } from '@/components/dashboard/ui';
import { saveRequirementAction, setRequirementActiveAction } from '@/features/competency/actions';
import { getRequirement, requirementLevels } from '@/features/competency/competency';
import { isUuid } from '@/features/competency/validation';
import { requirePermission } from '@/lib/auth/session';
import { GOLONGAN_OPTIONS } from '@/lib/domain';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Ubah syarat SKU/SKK' };

const SAVED: Record<string, string> = {
  aktif: 'Syarat diaktifkan kembali dan kini dihitung dalam kemajuan anggota.',
  nonaktif: 'Syarat dinonaktifkan. Tidak lagi dihitung dan tidak dapat diverifikasi; verifikasi lama tetap tersimpan.',
};

export default async function SkuEditorPage({ params, searchParams }: { params: { id: string }; searchParams?: { tersimpan?: string } }) {
  const user = await requirePermission('competency.manage');
  const isNew = params.id === 'baru';
  if (!isNew && !isUuid(params.id)) notFound();
  const row = isNew ? null : await getRequirement(user, params.id);
  if (!isNew && !row) notFound();
  const levels = await requirementLevels(user);
  const golonganOptions = GOLONGAN_OPTIONS.map((o) => ({ value: o.value, label: o.label }));

  return (
    <>
      <PortalHeader title={row ? 'Ubah syarat' : 'Tambah syarat'} back={{ href: '/dashboard/sku', label: 'Daftar syarat SKU/SKK' }} />
      {searchParams?.tersimpan && SAVED[searchParams.tersimpan] && <Notice>{SAVED[searchParams.tersimpan]}</Notice>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <RequirementForm
            action={saveRequirementAction.bind(null, row?.id ?? null)}
            golonganOptions={golonganOptions}
            levels={levels}
            golonganLocked={Boolean(row?.golonganLocked)}
            defaults={
              row
                ? {
                    kind: row.kind,
                    golongan: row.golongan,
                    level: row.level,
                    code: row.code,
                    title: row.title,
                    description: row.description,
                    sortOrder: row.sortOrder,
                  }
                : undefined
            }
          />
        </div>

        {row && (
          <div className="min-w-0 space-y-6">
            <Panel title="Status syarat">
              <InfoList
                columns={1}
                items={[
                  { label: 'Status', value: <RequirementActiveBadge active={row.active} /> },
                  { label: 'Verifikasi yang berlaku', value: `${row.verifiedCount.toLocaleString('id-ID')} anggota` },
                  { label: 'Dibuat', value: formatDate(row.createdAt.toISOString()) },
                  { label: 'Terakhir diubah', value: formatDate(row.updatedAt.toISOString()) },
                ]}
              />
              <p className="mt-4 text-sm text-text-secondary">
                {row.active
                  ? 'Menonaktifkan syarat tidak menghapus verifikasi yang sudah tercatat; syarat hanya berhenti dihitung.'
                  : 'Syarat ini tidak dihitung dalam kemajuan anggota dan tidak dapat diverifikasi.'}
              </p>
              <div className="mt-4">
                {row.active ? (
                  <ActionButton
                    action={setRequirementActiveAction.bind(null, row.id, false)}
                    variant="outline"
                    size="md"
                    confirm={`Nonaktifkan syarat ${row.code}? Kemajuan anggota akan dihitung ulang tanpa syarat ini.`}
                  >
                    <CircleOff className="h-4 w-4" aria-hidden="true" />
                    Nonaktifkan
                  </ActionButton>
                ) : (
                  <ActionButton action={setRequirementActiveAction.bind(null, row.id, true)} variant="outline" size="md">
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Aktifkan kembali
                  </ActionButton>
                )}
              </div>
            </Panel>
          </div>
        )}
      </div>
    </>
  );
}
