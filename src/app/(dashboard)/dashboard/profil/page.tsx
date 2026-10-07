import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { InfoList, MemberStatusBadge, Notice, Panel, PortalHeader } from '@/components/dashboard/ui';
import { getOwnMember } from '@/features/portal/peserta';
import { requirePermission } from '@/lib/auth/session';
import { GENDER_LABELS, ageOn, golonganLabel } from '@/lib/domain';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Profil saya' };

/**
 * Hanya data diri anggota itu sendiri. Alamat, nomor telepon, dan data wali sengaja tidak
 * ditampilkan di sini: perubahan & pemeriksaannya lewat pembina gudep (prinsip minimisasi data).
 */
export default async function ProfilPage() {
  const user = await requirePermission('self.portal');
  const own = await getOwnMember(user);

  if (!own) {
    return (
      <>
        <PortalHeader title="Profil saya" />
        <Notice tone="warning">Akun Anda belum tertaut ke data keanggotaan. Hubungi pembina gudep Anda.</Notice>
      </>
    );
  }
  const { m, gudep, kwarranName } = own;

  return (
    <>
      <PortalHeader title="Profil saya" description="Data keanggotaan Anda di Kwarcab Indramayu." />

      {m.status === 'NEEDS_FIX' && (
        <Notice tone="warning">
          <span className="font-semibold">Data Anda dikembalikan untuk diperbaiki.</span>{' '}
          {m.reviewNote ?? 'Hubungi pembina gudep untuk keterangan.'}
        </Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title="Data diri" className="lg:col-span-3">
          <InfoList
            items={[
              { label: 'Nama lengkap', value: m.fullName },
              { label: 'Jenis kelamin', value: GENDER_LABELS[m.gender] },
              { label: 'Tanggal lahir', value: `${formatDate(m.birthDate)} (${ageOn(m.birthDate)} tahun)` },
              { label: 'Golongan', value: golonganLabel(m.golongan) },
              { label: 'Gugus depan', value: gudep.name },
              { label: 'Kwarran', value: kwarranName },
              { label: 'Nomor KTA', value: m.kta ?? 'Belum terbit' },
              { label: 'Bergabung sejak', value: m.joinedAt ? formatDate(m.joinedAt) : null },
            ]}
          />
        </Panel>

        <div className="space-y-6 lg:col-span-2">
          <Panel title="Status keanggotaan">
            <MemberStatusBadge status={m.status} />
            <p className="mt-3 text-sm text-text-secondary">
              {m.status === 'ACTIVE'
                ? 'Data Anda sudah diverifikasi. Anda dapat mendaftar kegiatan.'
                : m.status === 'PENDING'
                  ? 'Data Anda sedang diperiksa oleh kwarran. Anda belum dapat mendaftar kegiatan.'
                  : 'Hubungi pembina gudep untuk tindak lanjut.'}
            </p>
          </Panel>

          <Panel title="Data Anda dan privasi">
            <p className="flex items-start gap-2 text-sm text-text-secondary">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-status-success-text" aria-hidden="true" />
              Alamat, nomor telepon, dan data wali hanya terlihat oleh pengurus yang berwenang, dan setiap akses tercatat.
            </p>
            <p className="mt-3 flex items-start gap-2 text-sm text-text-secondary">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Ada data yang keliru? Minta pembina gudep memperbaikinya. Hak Anda atas data pribadi dijelaskan di{' '}
              <Link href="/kebijakan-privasi" className="font-medium text-text-accent underline underline-offset-2">
                Kebijakan Privasi
              </Link>
              .
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
