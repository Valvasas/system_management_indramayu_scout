import { asc, eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import type { EventRow } from '@/db/schema';
import type { AgendaItem, AgendaStatus } from '@/types';

export const AGENDA_STATUSES: AgendaStatus[] = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'];

export const isAgendaStatus = (v: string): v is AgendaStatus =>
  (AGENDA_STATUSES as string[]).includes(v);

/** Status dihitung dari tanggal, jadi tidak perlu diperbarui manual. */
export function agendaStatusOf(e: Pick<EventRow, 'cancelled' | 'dateStart' | 'dateEnd'>, now = new Date()): AgendaStatus {
  if (e.cancelled) return 'CANCELLED';
  const end = e.dateEnd ?? new Date(e.dateStart.getTime() + 6 * 3600_000);
  if (now < e.dateStart) return 'UPCOMING';
  if (now <= end) return 'ONGOING';
  return 'COMPLETED';
}

const toItem = (e: EventRow): AgendaItem => ({
  id: e.id,
  slug: e.slug,
  title: e.title,
  dateStart: e.dateStart.toISOString(),
  dateEnd: (e.dateEnd ?? e.dateStart).toISOString(),
  location: e.location,
  organizer: e.organizer,
  description: e.description,
  status: agendaStatusOf(e),
  contactPerson: e.contactPerson ?? '',
});

async function publishedEvents(): Promise<AgendaItem[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.events)
    .where(eq(schema.events.published, true))
    .orderBy(asc(schema.events.dateStart));
  return rows.map(toItem);
}

export interface AgendaQuery {
  status?: AgendaStatus;
  limit?: number;
}

export async function getAgenda({ status, limit }: AgendaQuery = {}): Promise<AgendaItem[]> {
  let items = await publishedEvents();
  if (status) items = items.filter((a) => a.status === status);
  return typeof limit === 'number' ? items.slice(0, limit) : items;
}

/** Agenda untuk beranda: yang berlangsung & akan datang saja, terdekat lebih dulu. */
export async function getUpcomingAgenda(limit = 3): Promise<AgendaItem[]> {
  const items = await publishedEvents();
  return items.filter((a) => a.status === 'UPCOMING' || a.status === 'ONGOING').slice(0, limit);
}

export async function getAgendaBySlug(slug: string): Promise<AgendaItem | null> {
  return (await publishedEvents()).find((a) => a.slug === slug) ?? null;
}

export async function getAgendaSlugs(): Promise<string[]> {
  return (await publishedEvents()).map((a) => a.slug);
}
