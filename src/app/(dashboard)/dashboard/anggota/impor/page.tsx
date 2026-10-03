import type { Metadata } from 'next';
import { Download } from 'lucide-react';
import { ImportFlow } from '@/components/dashboard/members/ImportFlow';
import { Panel, PortalHeader } from '@/components/dashboard/ui';
import { buttonStyles } from '@/components/ui/Button';
import { can, requirePermission } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Impor anggota' };

const COLUMNS: [string, string][] = [
  ['nama_lengkap', 'Wajib'],
  ['jenis_kelamin', 'Wajib — L atau P'],
  ['tanggal_lahir', 'Wajib — 2012-05-17 atau 17/05/2012'],
  ['golongan', 'Wajib — Siaga, Penggalang, Penegak, Pandega, Dewasa'],
  ['nomor_gudep', 'Wajib (kecuali staf gudep: otomatis gudep Anda)'],
  ['nama_wali, telepon_wali, tanggal_persetujuan_wali', 'Wajib bila usia di bawah 18 tahun'],
  ['nomor_kta, telepon, alamat, tanggal_bergabung, catatan', 'Opsional'],
];

export default async function ImporAnggotaPage() {
  const user = await requirePermission('members.import');

  return (
    <>
      <PortalHeader
        title="Impor anggota dari Excel"
        description="Pindahkan data lama sekaligus. Sistem memeriksa setiap baris dan menunjukkan hasilnya sebelum ada yang disimpan."
        back={{ href: '/dashboard/anggota', label: 'Kembali ke daftar anggota' }}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ImportFlow />
        </div>
        <Panel title="Format berkas">
          <a href="/dashboard/anggota/impor/templat" className={buttonStyles('outline', 'md', 'w-full')}>
            <Download className="h-4 w-4" aria-hidden="true" />
            Unduh templat CSV
          </a>
          <dl className="mt-5 space-y-3 text-sm">
            {COLUMNS.map(([col, rule]) => (
              <div key={col}>
                <dt className="font-mono text-text-primary">{col}</dt>
                <dd className="text-text-secondary">{rule}</dd>
              </div>
            ))}
          </dl>
          {!can(user, 'members.verify') && (
            <p className="mt-5 text-sm text-text-secondary">Data hasil impor berstatus Menunggu verifikasi sampai diperiksa staf Kwarran.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
