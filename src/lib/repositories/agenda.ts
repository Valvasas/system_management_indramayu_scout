import { mockAgendas } from '@/lib/data/mock-data';
import type { AgendaItem, AgendaStatus } from '@/types';

const byStartDate = (a: AgendaItem, b: AgendaItem) =>
  new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime();

export const AGENDA_STATUSES: AgendaStatus[] = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'];

export const isAgendaStatus = (v: string): v is AgendaStatus =>
  (AGENDA_STATUSES as string[]).includes(v);

export interface AgendaQuery {
  status?: AgendaStatus;
  limit?: number;
}

export async function getAgenda({ status, limit }: AgendaQuery = {}): Promise<AgendaItem[]> {
  let items = [...mockAgendas].sort(byStartDate);
  if (status) items = items.filter((a) => a.status === status);
  return typeof limit === 'number' ? items.slice(0, limit) : items;
}

/** Agenda untuk beranda: yang akan datang & berlangsung lebih dulu. */
export async function getUpcomingAgenda(limit = 3): Promise<AgendaItem[]> {
  const items = [...mockAgendas].sort(byStartDate);
  const active = items.filter((a) => a.status === 'UPCOMING' || a.status === 'ONGOING');
  return (active.length ? active : items).slice(0, limit);
}

export async function getAgendaBySlug(slug: string): Promise<AgendaItem | null> {
  return mockAgendas.find((a) => a.slug === slug) ?? null;
}

export async function getAgendaSlugs(): Promise<string[]> {
  return mockAgendas.map((a) => a.slug);
}
