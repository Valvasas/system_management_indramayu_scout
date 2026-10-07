import { CheckCircle2, ShieldAlert, ShieldOff } from 'lucide-react';
import { ActionButton } from '@/components/dashboard/ConfirmButton';
import { Notice, Panel } from '@/components/dashboard/ui';
import { Badge } from '@/components/ui/Badge';
import type { Role } from '@/db/schema';
import { getMfaRecord } from '@/features/auth/mfa';
import { resetUserMfaAction } from '@/features/auth/mfa-actions';
import { canResetMfa, requiresMfa } from '@/lib/auth/mfa-policy';
import { formatDate } from '@/lib/format';

/** Status MFA akun staf + tombol reset (hanya Super Admin; dicek lagi di server). */
export async function MfaAdminPanel({
  actor,
  target,
  reset,
}: {
  actor: { id: string; role: Role };
  target: { id: string; role: Role; name: string };
  reset: boolean;
}) {
  const record = await getMfaRecord(target.id);
  const active = Boolean(record?.confirmedAt);
  return (
    <Panel title="Verifikasi dua langkah">
      {reset && <Notice>MFA direset dan semua sesi akun ini diputus. Pemilik akun mendaftar ulang saat masuk berikutnya.</Notice>}
      <div className="flex flex-wrap items-center gap-2">
        {active ? (
          <Badge tone="success" icon={CheckCircle2}>
            Aktif sejak {formatDate(record!.confirmedAt!.toISOString())}
          </Badge>
        ) : requiresMfa(target.role) ? (
          <Badge tone="warning" icon={ShieldAlert}>
            Belum aktif (wajib untuk peran ini)
          </Badge>
        ) : (
          <Badge tone="neutral" icon={ShieldOff}>
            Belum aktif (sukarela)
          </Badge>
        )}
      </div>
      {active && canResetMfa(actor, target) && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-text-secondary">
            Reset hanya bila pemilik akun kehilangan ponsel dan kode pemulihan, setelah identitasnya dipastikan langsung. Tercatat di log.
          </p>
          <ActionButton
            action={resetUserMfaAction.bind(null, target.id)}
            variant="danger"
            size="md"
            confirm={`Reset MFA ${target.name}? Semua sesinya akan diputus.`}
          >
            <ShieldOff className="h-4 w-4" aria-hidden="true" />
            Reset MFA
          </ActionButton>
        </div>
      )}
    </Panel>
  );
}
