/** Data & aksi khusus akun PESERTA — hanya data milik anggota itu sendiri. */
import { and, asc, eq, gte, inArray } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import type { SessionUser } from '@/lib/auth/session';

export async function getOwnMember(user: SessionUser) {
  if (user.role !== 'PESERTA' || !user.memberId) return null;
  const db = await getDb();
  const [row] = await db
    .select({ m: schema.members, gudep: schema.gudep, kwarranName: schema.kwarran.name })
    .from(schema.members)
    .innerJoin(schema.gudep, eq(schema.gudep.id, schema.members.gudepId))
    .innerJoin(schema.kwarran, eq(schema.kwarran.id, schema.gudep.kwarranId))
    .where(eq(schema.members.id, user.memberId))
    .limit(1);
  return row ?? null;
}

/** Kegiatan mendatang yang tayang + penanda apakah peserta sudah terdaftar. */
export async function upcomingEventsFor(user: SessionUser) {
  const db = await getDb();
  const events = await db
    .select()
    .from(schema.events)
    .where(and(eq(schema.events.published, true), eq(schema.events.cancelled, false), gte(schema.events.dateStart, new Date(Date.now() - 86400_000))))
    .orderBy(asc(schema.events.dateStart))
    .limit(30);
  const registered = new Set<string>();
  if (user.memberId && events.length) {
    const regs = await db
      .select({ eventId: schema.eventRegistrations.eventId })
      .from(schema.eventRegistrations)
      .where(and(eq(schema.eventRegistrations.memberId, user.memberId), inArray(schema.eventRegistrations.eventId, events.map((e) => e.id))));
    for (const r of regs) registered.add(r.eventId);
  }
  return events.map((e) => ({ ...e, registered: registered.has(e.id) }));
}
