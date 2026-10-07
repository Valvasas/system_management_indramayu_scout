import { and, desc, eq, inArray, isNull, or, type SQL } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { gudepScope, scopeLevel } from '@/lib/auth/scope';
import type { SessionUser } from '@/lib/auth/session';

async function gudepIdsInScope(user: SessionUser): Promise<string[]> {
  const db = await getDb();
  return (await db.select({ id: schema.gudep.id }).from(schema.gudep).where(gudepScope(user))).map((g) => g.id);
}

/** Pengumuman yang relevan untuk dibaca pengguna ini. */
export async function announcementsFor(user: SessionUser, limit = 10) {
  const db = await getDb();
  let where: SQL | undefined;
  if (user.role === 'PESERTA') {
    where = and(
      inArray(schema.announcements.audience, ['ALL', 'PESERTA']),
      user.gudepId
        ? or(isNull(schema.announcements.gudepId), eq(schema.announcements.gudepId, user.gudepId))
        : isNull(schema.announcements.gudepId),
    );
  } else if (scopeLevel(user) === 'KABUPATEN' || user.role === 'ADMIN_WEBSITE') {
    where = inArray(schema.announcements.audience, ['ALL', 'STAFF']);
  } else {
    const ids = await gudepIdsInScope(user);
    where = and(
      inArray(schema.announcements.audience, ['ALL', 'STAFF']),
      ids.length
        ? or(isNull(schema.announcements.gudepId), inArray(schema.announcements.gudepId, ids))
        : isNull(schema.announcements.gudepId),
    );
  }
  return db
    .select({ a: schema.announcements, gudepName: schema.gudep.name })
    .from(schema.announcements)
    .leftJoin(schema.gudep, eq(schema.gudep.id, schema.announcements.gudepId))
    .where(where)
    .orderBy(desc(schema.announcements.createdAt))
    .limit(limit);
}

/** Pengumuman yang boleh dikelola pengguna ini. */
export async function managedAnnouncements(user: SessionUser) {
  const db = await getDb();
  let where: SQL | undefined;
  if (!(scopeLevel(user) === 'KABUPATEN' || user.role === 'ADMIN_WEBSITE')) {
    const ids = await gudepIdsInScope(user);
    where = ids.length ? inArray(schema.announcements.gudepId, ids) : eq(schema.announcements.id, '00000000-0000-0000-0000-000000000000');
  }
  return db
    .select({ a: schema.announcements, gudepName: schema.gudep.name })
    .from(schema.announcements)
    .leftJoin(schema.gudep, eq(schema.gudep.id, schema.announcements.gudepId))
    .where(where)
    .orderBy(desc(schema.announcements.createdAt))
    .limit(200);
}

export const canTargetWholeKwarcab = (user: SessionUser) => scopeLevel(user) === 'KABUPATEN' || user.role === 'ADMIN_WEBSITE';
