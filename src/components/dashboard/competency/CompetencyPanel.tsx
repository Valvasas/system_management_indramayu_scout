import Link from 'next/link';
import { Download, Info } from 'lucide-react';
import { Panel } from '@/components/dashboard/ui';
import { buttonStyles } from '@/components/ui/Button';
import { verificationAction } from '@/features/competency/actions';
import { memberProgress, ownProgress } from '@/features/competency/competency';
import { can, type SessionUser } from '@/lib/auth/session';
import { golonganLabel } from '@/lib/domain';
import { CompetencyGroups } from './CompetencyGroups';
import { VerificationControl } from './VerificationControl';

/**
 * Panel SKU/SKK di detail anggota (staf). Data & hak verifikasi dihitung ulang di server oleh
 * `memberProgress` (izin + cakupan): halaman pemanggil bukan satu-satunya penjaga. Di luar cakupan
 * → panel tidak dirender sama sekali.
 */
export async function CompetencyPanel({ user, memberId }: { user: SessionUser; memberId: string }) {
  const progress = await memberProgress(user, memberId);
  if (!progress || progress.self) return null;
  const { member, groups, canVerify } = progress;
  const canExport = can(user, 'competency.verify') && can(user, 'members.export');

  return (
    <Panel
      id="sku"
      title="Kemajuan SKU/SKK"
      description={`Golongan ${golonganLabel(member.golongan)}. Hanya syarat aktif yang dihitung.`}
      action={
        canExport ? (
          <a href={`/dashboard/sku/ekspor?gudep=${member.gudepId}`} className={buttonStyles('ghost', 'sm')}>
            <Download className="h-4 w-4" aria-hidden="true" />
            Rekap gudep (CSV)
          </a>
        ) : undefined
      }
    >
      {groups.length === 0 ? (
        <p className="flex items-start gap-2 text-sm text-text-secondary">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Belum ada daftar syarat aktif untuk golongan {golonganLabel(member.golongan)}.{' '}
            {can(user, 'competency.manage') ? (
              <Link href="/dashboard/sku" className="font-semibold text-text-accent underline underline-offset-2">
                Kelola daftar syarat
              </Link>
            ) : (
              'Daftar syarat disiapkan pengurus Kwarcab.'
            )}
          </span>
        </p>
      ) : (
        <>
          {!canVerify && (
            <p className="mb-4 flex items-start gap-2 text-sm text-text-secondary">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {member.status === 'ARCHIVED'
                ? 'Anggota diarsipkan: kemajuan hanya dapat dilihat, tidak dapat diubah.'
                : 'Anda dapat melihat kemajuan ini, tetapi tidak dapat mengubahnya.'}
            </p>
          )}
          <CompetencyGroups
            groups={groups}
            showInternal
            control={
              canVerify
                ? (item) => (
                    <VerificationControl
                      action={verificationAction.bind(null, member.id, item.requirement.id)}
                      requirementId={item.requirement.id}
                      code={item.requirement.code}
                      verified={Boolean(item.verified)}
                    />
                  )
                : undefined
            }
          />
        </>
      )}
    </Panel>
  );
}

/** Kemajuan milik peserta yang sedang masuk (hanya-baca, tanpa catatan & riwayat pembatalan). */
export async function OwnCompetencyPanel({ user }: { user: SessionUser }) {
  const progress = await ownProgress(user);
  if (!progress) return null;
  return (
    <Panel
      id="sku"
      title="Kemajuan SKU/SKK saya"
      description="Syarat diverifikasi oleh pembina. Bila ada syarat yang sudah Anda tempuh tetapi belum tercatat, sampaikan kepada pembina gudep."
    >
      {progress.groups.length === 0 ? (
        <p className="flex items-start gap-2 text-sm text-text-secondary">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Daftar syarat untuk golongan {golonganLabel(progress.member.golongan)} belum tersedia di portal.
        </p>
      ) : (
        <CompetencyGroups groups={progress.groups} showInternal={false} idPrefix="sku-saya" />
      )}
    </Panel>
  );
}
