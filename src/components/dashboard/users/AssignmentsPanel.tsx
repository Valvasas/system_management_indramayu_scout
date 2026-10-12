import { CalendarPlus, CalendarX2 } from 'lucide-react';
import type { Role } from '@/db/schema';
import { ActionForm, SubmitButton } from '@/components/forms/ActionForm';
import { SelectField, TextField, type Option } from '@/components/forms/Fields';
import { ActionButton } from '@/components/dashboard/ConfirmButton';
import { TermStateBadge } from '@/components/dashboard/terms/TermStateBadge';
import { Notice, Panel, TableWrap, td, th } from '@/components/dashboard/ui';
import type { AssignmentView } from '@/features/terms/assignments';
import { daysLeftLabel, termRangeLabel } from '@/features/terms/labels';
import { ASSIGNMENT_FIELDS as F } from '@/features/terms/validation';
import { addAssignmentAction, endAssignmentAction } from '@/features/users/assignment-actions';
import { ROLE_LABELS } from '@/lib/auth/permissions';

/**
 * Riwayat penugasan & masa jabatan satu akun staf (2.4). Server Component: izin & cakupan
 * ditegakkan di features/terms/assignments.ts (dipanggil halaman dan Server Action).
 * Penugasan bersifat informasional — tidak mengubah peran, wilayah, atau akses akun.
 */
export function AssignmentsPanel({
  userId,
  userName,
  assignments,
  roles,
  kwarranOptions,
  gudepOptions,
  notice,
}: {
  userId: string;
  userName: string;
  assignments: AssignmentView[];
  /** Peran yang boleh dicatat oleh aktor (Super Admin hanya oleh Super Admin). */
  roles: Role[];
  kwarranOptions: Option[];
  gudepOptions: Option[];
  notice?: string;
}) {
  return (
    <Panel
      id="penugasan"
      title="Penugasan & masa jabatan"
      description="Riwayat jabatan akun ini. Penugasan hanya catatan: peran, wilayah, dan akses akun tetap diatur dari formulir di atas."
    >
      {notice === 'diakhiri' && <Notice>Penugasan diakhiri. Akses akun tidak berubah.</Notice>}
      {notice === 'gagal' && <Notice tone="warning">Penugasan tidak ditemukan atau sudah berakhir.</Notice>}

      {assignments.length === 0 ? (
        <p className="text-text-secondary">Belum ada penugasan yang tercatat untuk {userName}.</p>
      ) : (
        <TableWrap label={`Riwayat penugasan ${userName}`}>
          <table className="w-full min-w-[44rem] text-base">
            <caption className="sr-only">Riwayat penugasan {userName}</caption>
            <thead className="border-b border-border-subtle">
              <tr>
                <th scope="col" className={th}>
                  Jabatan
                </th>
                <th scope="col" className={th}>
                  Wilayah
                </th>
                <th scope="col" className={th}>
                  Masa jabatan
                </th>
                <th scope="col" className={th}>
                  Status
                </th>
                <th scope="col" className={th}>
                  <span className="sr-only">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {assignments.map((a) => (
                <tr key={a.id}>
                  <td className={td}>
                    <span className="block font-semibold text-text-primary">{a.position}</span>
                    <span className="block text-sm text-text-secondary">{ROLE_LABELS[a.role]}</span>
                  </td>
                  <td className={td}>{a.gudepName ?? a.kwarranName ?? 'Tingkat kabupaten'}</td>
                  <td className={td}>
                    <span className="block">{termRangeLabel(a.termStart, a.termEnd)}</span>
                    {a.state === 'ENDING' && a.daysLeft !== null && (
                      <span className="block text-sm text-text-secondary">{daysLeftLabel(a.daysLeft)}</span>
                    )}
                  </td>
                  <td className={td}>
                    <TermStateBadge state={a.state} isActive={a.isActive} />
                  </td>
                  <td className={td}>
                    {a.state !== 'ENDED' && (
                      <ActionButton
                        action={endAssignmentAction.bind(null, userId, a.id)}
                        confirm={`Akhiri penugasan "${a.position}" per hari ini? Akses akun tidak berubah.`}
                        label={`Akhiri penugasan ${a.position}`}
                      >
                        <CalendarX2 className="h-4 w-4" aria-hidden="true" />
                        Akhiri
                      </ActionButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}

      <div className="mt-6 border-t border-border-subtle pt-6">
        <h3 className="font-display text-lg font-semibold text-text-primary">Catat penugasan</h3>
        <p className="mt-1 text-sm text-text-secondary">
          Kwarran hanya untuk Staf Kwarran; gudep hanya untuk Pembina/Staf Gudep (kwarrannya mengikuti gudep).
        </p>
        <ActionForm action={addAssignmentAction.bind(null, userId)} resetOnSuccess aria-label="Catat penugasan baru" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name={F.position} label="Jabatan" maxLength={150} hint="Mis. Pembina Gudep, Andalan Kwarran." required />
            <SelectField
              name={F.role}
              label="Peran dalam penugasan"
              placeholder="Pilih peran…"
              options={roles.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField name={F.kwarranId} label="Kwarran" placeholder="Tidak ada" options={kwarranOptions} />
            <SelectField name={F.gudepId} label="Gudep" placeholder="Tidak ada" options={gudepOptions} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name={F.termStart} label="Tanggal mulai" type="date" required />
            <TextField name={F.termEnd} label="Tanggal berakhir" type="date" hint="Opsional. Tidak boleh sebelum tanggal mulai." />
          </div>
          <SubmitButton variant="secondary">
            <CalendarPlus className="h-4 w-4" aria-hidden="true" />
            Catat penugasan
          </SubmitButton>
        </ActionForm>
      </div>
    </Panel>
  );
}
