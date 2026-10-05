import { getAgenda } from '@/lib/repositories';
import { buildIcs } from '@/lib/ics';
import { absoluteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

/** Feed langganan seluruh agenda tayang (kecuali yang dibatalkan): kalender pengguna ikut ter-update. */
export async function GET() {
  const items = (await getAgenda()).filter((a) => a.status !== 'CANCELLED');
  const ics = buildIcs(
    items.map((a) => ({
      uid: `agenda-${a.id}@pramukaindramayu.or.id`,
      title: a.title,
      start: new Date(a.dateStart),
      end: a.dateEnd ? new Date(a.dateEnd) : null,
      location: a.location,
      description: a.description,
      url: absoluteUrl(`/agenda/${a.slug}`),
    })),
  );
  return new Response(ics, {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'public, max-age=900' },
  });
}
