import { exportAttendanceCsv } from '@/features/attendance/attendance';
import { authorizedUser } from '@/lib/auth/session';
import { clientIp } from '@/lib/security/request';

export const dynamic = 'force-dynamic';

/**
 * CSV presensi satu kegiatan: pendaftar dalam cakupan pengguna, tanpa catatan & kolom sensitif.
 * `authorizedUser` menolak tanpa sesi, sesi wajib-MFA yang tenggangnya habis, dan peran tanpa
 * `attendance.record`. `exportAttendanceCsv` menegakkan `members.export` + cakupan baris; id asing dan
 * kegiatan tidak tayang menjawab 404. Setiap unduhan tercatat di log audit.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await authorizedUser('attendance.record');
  if (!user) return new Response('Tidak diizinkan', { status: 403 });
  const result = await exportAttendanceCsv(user, params.id, { ip: clientIp() });
  if (!result) return new Response('Tidak ditemukan', { status: 404 });
  return new Response(result.csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
