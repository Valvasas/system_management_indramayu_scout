/**
 * Pendaftar kegiatan untuk staf. Selalu dibatasi cakupan anggota (memberScope):
 * staf gudep hanya melihat anggotanya sendiri, staf kwarran se-kecamatan, Kwarcab semuanya.
 * Hanya kolom non-sensitif (tanpa kontak/alamat/wali).
 */
import { and, asc, count, desc, eq, gte } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { memberScope } from '@/lib/auth/scope';
import type { SessionUser } from '@/lib/auth/session';

/** Agenda tayang sejak 60 hari lalu + jumlah pendaftar dalam cakupan pengguna. */
export async function eventsWithRegistrations(user: SessionUser) {
  const db = await getDb();
  const counts = db
    .select({ eventId: schema.eventRegistrations.eventId, n: count().as('n') })
    .from(schema.eventRegistrations)
    .innerJoin(schema.members, eq(schema.members.id, schema.eventRegistrations.memberId))
    .innerJoin(schema.gudep, eq(schema.gudep.id, schema.members.gudepId))
    .where(memberScope(user))
    .groupBy(schema.eventRegistrations.eventId)
    .as('c');
  const rows = await db
    .select({ e: schema.events, n: counts.n })
    .from(schema.events)
    .leftJoin(counts, eq(counts.eventId, schema.events.id))
    .where(and(eq(schema.events.published, true), gte(schema.events.dateStart, new Date(Date.now() - 60 * 86400_000))))
    .orderBy(asc(schema.events.dateStart));
  return rows.map((r) => ({ ...r.e, registrants: Number(r.n ?? 0) }));
}

export async function getEvent(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = await getDb();
  const [row] = await db.select().from(schema.events).where(eq(schema.events.id, id)).limit(1);
  return row ?? null;
}

export async function registrantsFor(user: SessionUser, eventId: string) {
  const db = await getDb();
  return db
    .select({
      memberId: schema.members.id,
      fullName: schema.members.fullName,
      golongan: schema.members.golongan,
      gender: schema.members.gender,
      kta: schema.members.kta,
      gudepName: schema.gudep.name,
      kwarranName: schema.kwarran.name,
      registeredAt: schema.eventRegistrations.createdAt,
    })
    .from(schema.eventRegistrations)
    .innerJoin(schema.members, eq(schema.members.id, schema.eventRegistrations.memberId))
    .innerJoin(schema.gudep, eq(schema.gudep.id, schema.members.gudepId))
    .innerJoin(schema.kwarran, eq(schema.kwarran.id, schema.gudep.kwarranId))
    .where(and(eq(schema.eventRegistrations.eventId, eventId), memberScope(user)))
    .orderBy(asc(schema.kwarran.name), asc(schema.gudep.name), asc(schema.members.fullName));
}

/** Total pendaftar seluruh kabupaten (angka agregat) — untuk CMS agenda. */
export async function registrationTotals() {
  const db = await getDb();
  const rows = await db
    .select({ eventId: schema.eventRegistrations.eventId, n: count() })
    .from(schema.eventRegistrations)
    .groupBy(schema.eventRegistrations.eventId)
    .orderBy(desc(count()));
  return new Map(rows.map((r) => [r.eventId, r.n]));
}
