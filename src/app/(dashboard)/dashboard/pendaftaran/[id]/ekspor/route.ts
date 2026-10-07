import { getEvent, registrantsFor } from '@/features/portal/registrations';
import { audit } from '@/lib/auth/audit';
import { authorizedUser, can } from '@/lib/auth/session';
import { toCsv } from '@/lib/csv';
import { GENDER_LABELS, golonganLabel } from '@/lib/domain';

export const dynamic = 'force-dynamic';

/** CSV pendaftar (dibatasi cakupan, tanpa kolom sensitif). Tercatat di log audit. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await authorizedUser('members.export');
  if (!user || !can(user, 'members.read')) return new Response('Tidak diizinkan', { status: 403 });
  const event = await getEvent(params.id);
  if (!event || !event.published) return new Response('Kegiatan tidak ditemukan', { status: 404 });
  const rows = await registrantsFor(user, event.id);
  const csv = toCsv(
    ['Nama Lengkap', 'No KTA', 'Jenis Kelamin', 'Golongan', 'Gudep', 'Kwarran', 'Tanggal Mendaftar'],
    rows.map((r) => [
      r.fullName,
      r.kta,
      GENDER_LABELS[r.gender],
      golonganLabel(r.golongan),
      r.gudepName,
      r.kwarranName,
      r.registeredAt.toISOString().slice(0, 10),
    ]),
  );
  await audit(user, {
    action: 'event.export',
    summary: `Mengekspor ${rows.length} pendaftar "${event.title}"`,
    entityType: 'event',
    entityId: event.id,
  });
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="pendaftar-${event.slug}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
