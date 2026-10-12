import { progressExport } from '@/features/competency/export';
import { authorizedUser } from '@/lib/auth/session';
import { clientIp } from '@/lib/security/request';

export const dynamic = 'force-dynamic';

/**
 * CSV rekap kemajuan SKU/SKK anggota dalam cakupan (`?gudep=<id>` opsional).
 * `authorizedUser` menolak tanpa sesi, sesi wajib-MFA yang tenggangnya habis, dan peran tanpa
 * `competency.verify`. `progressExport` menegakkan lagi izin (+ `members.export`) dan cakupan baris;
 * gudep di luar cakupan atau id asing menjawab 404 tanpa membedakan keduanya. Kolom non-sensitif,
 * aman injeksi formula, dan setiap unduhan tercatat di log audit.
 */
export async function GET(req: Request) {
  const user = await authorizedUser('competency.verify');
  if (!user) return new Response('Tidak diizinkan', { status: 403 });
  const gudepId = new URL(req.url).searchParams.get('gudep') || null;
  const result = await progressExport(user, { gudepId }, { ip: clientIp() });
  if (!result) return new Response('Tidak ditemukan', { status: 404 });
  return new Response(result.csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
