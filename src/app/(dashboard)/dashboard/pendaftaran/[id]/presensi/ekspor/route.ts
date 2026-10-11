import { exportAttendanceCsv } from '@/features/attendance/attendance';
import { getSessionUser } from '@/lib/auth/session';
import { clientIp } from '@/lib/security/request';

export const dynamic = 'force-dynamic';

/**
 * CSV presensi satu kegiatan: pendaftar dalam cakupan pengguna, tanpa catatan & kolom sensitif.
 * Izin (`attendance.record` + `members.export`) dan cakupan ditegakkan di `exportAttendanceCsv`;
 * tanpa izin, id asing, dan kegiatan di luar jangkauan sama-sama 404. Setiap unduhan tercatat di log audit.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return new Response('Silakan masuk terlebih dahulu', { status: 401 });
  // Sama dengan requireUser(): akun wajib-MFA yang tenggangnya habis tidak boleh mengunduh data.
  if (user.mfa.kind === 'expired') return new Response('Aktifkan verifikasi dua langkah terlebih dahulu', { status: 403 });
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
