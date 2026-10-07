import { templateGudepNumber } from '@/features/members/import';
import { authorizedUser } from '@/lib/auth/session';
import { toCsv } from '@/lib/csv';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await authorizedUser('members.import');
  if (!user) return new Response('Tidak diizinkan', { status: 403 });

  const header = [
    'nama_lengkap',
    'jenis_kelamin',
    'tanggal_lahir',
    'golongan',
    'nomor_gudep',
    'nomor_kta',
    'telepon',
    'alamat',
    'nama_wali',
    'telepon_wali',
    'tanggal_bergabung',
    'catatan',
  ];
  // Baris contoh diawali '#' sehingga diabaikan bila lupa dihapus.
  const example = [
    '# CONTOH Nama Anggota (baris ini diabaikan)',
    'P',
    '17/05/2012',
    'Penggalang',
    await templateGudepNumber(user),
    '',
    '',
    '',
    'Contoh Nama Wali',
    '0812-0000-0000',
    '01/07/2026',
    '15/07/2026',
    '',
  ];

  return new Response(toCsv(header, [example]), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="templat-impor-anggota.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
