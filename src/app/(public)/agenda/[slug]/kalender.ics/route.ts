import { getAgendaBySlug } from '@/lib/repositories';
import { buildIcs } from '@/lib/ics';
import { absoluteUrl } from '@/lib/site';

/** Satu agenda sebagai berkas .ics ("Simpan ke kalender"). */
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const a = await getAgendaBySlug(params.slug);
  if (!a) return new Response('Agenda tidak ditemukan.', { status: 404 });
  const ics = buildIcs([
    {
      uid: `agenda-${a.id}@pramukaindramayu.or.id`,
      title: a.title,
      start: new Date(a.dateStart),
      end: a.dateEnd ? new Date(a.dateEnd) : null,
      location: a.location,
      description: `${a.description}\n\nPenyelenggara: ${a.organizer}`,
      url: absoluteUrl(`/agenda/${a.slug}`),
    },
  ]);
  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${a.slug}.ics"`,
      'Cache-Control': 'public, max-age=300',
    },
  });
}
