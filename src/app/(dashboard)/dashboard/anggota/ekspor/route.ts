import { golonganEnum, memberStatusEnum, type Golongan, type MemberStatus } from '@/db/schema';
import { listMembersForExport } from '@/features/members/queries';
import { audit } from '@/lib/auth/audit';
import { authorizedUser, can } from '@/lib/auth/session';
import { toCsv } from '@/lib/csv';
import { GENDER_LABELS, MEMBER_STATUS_LABELS, golonganLabel } from '@/lib/domain';
import { CONSENT_KIND_LABELS } from '@/components/dashboard/consent/ConsentBadge';
import { consentStatusesFor } from '@/features/consent/consent';
import { needsGuardianConsent } from '@/features/consent/status';

export const dynamic = 'force-dynamic';

/** Ekspor CSV anggota sesuai filter & cakupan. Kolom sensitif hanya bagi yang berhak. Tercatat di log audit. */
export async function GET(req: Request) {
  // authorizedUser: juga menolak akun yang masa tenggang MFA-nya habis.
  const user = await authorizedUser('members.export');
  if (!user) return new Response('Tidak diizinkan', { status: 403 });

  const p = new URL(req.url).searchParams;
  const golongan = p.get('golongan');
  const status = p.get('status');
  const filters = {
    q: p.get('q')?.slice(0, 80) || undefined,
    gudepId: p.get('gudep') || undefined,
    golongan: (golonganEnum.enumValues as string[]).includes(golongan ?? '') ? (golongan as Golongan) : undefined,
    status: (memberStatusEnum.enumValues as string[]).includes(status ?? '') ? (status as MemberStatus) : undefined,
  };

  const rows = await listMembersForExport(user, filters);
  const sensitive = can(user, 'members.view_sensitive');

  const header = [
    'No KTA',
    'Nama Lengkap',
    'Jenis Kelamin',
    'Tanggal Lahir',
    'Golongan',
    'Gudep',
    'No Gudep',
    'Kwarran',
    'Status',
    'Tanggal Bergabung',
  ];
  if (sensitive)
    header.push('Telepon', 'Alamat', 'Nama Wali', 'Telepon Wali', 'Persetujuan Data', 'Persetujuan Foto', 'Persetujuan Kegiatan');
  // Status persetujuan wali terkini (bukan tanggal manual lama).
  const consents: Awaited<ReturnType<typeof consentStatusesFor>> = sensitive
    ? await consentStatusesFor(rows.map((r) => r.m.id))
    : new Map();

  const body = rows.map(({ m, gudepName, gudepNumber, kwarranName }) => {
    const base: unknown[] = [
      m.kta,
      m.fullName,
      GENDER_LABELS[m.gender],
      m.birthDate,
      golonganLabel(m.golongan),
      gudepName,
      gudepNumber,
      kwarranName,
      MEMBER_STATUS_LABELS[m.status],
      m.joinedAt,
    ];
    if (sensitive) {
      const c = consents.get(m.id);
      const label = (scope: 'DATA' | 'PHOTO' | 'ACTIVITY') =>
        needsGuardianConsent(m.birthDate) && c ? CONSENT_KIND_LABELS[c[scope].kind] : 'Tidak diperlukan';
      base.push(m.phone, m.address, m.guardianName, m.guardianPhone, label('DATA'), label('PHOTO'), label('ACTIVITY'));
    }
    return base;
  });

  await audit(user, {
    action: 'member.export',
    summary: `Mengekspor ${rows.length} data anggota${sensitive ? ' (termasuk kolom sensitif)' : ''}`,
    entityType: 'member',
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(toCsv(header, body), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="anggota-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
