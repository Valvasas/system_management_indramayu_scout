/**
 * Query admin untuk CMS konten. Berbeda dari `lib/repositories/*` (yang hanya memuat
 * konten TAYANG untuk situs publik), di sini draf juga ikut terbaca.
 * Pemanggil wajib sudah lolos `requirePermission('content.manage')`.
 */
import { asc, count, desc, eq, sql } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { getDb, schema } from '@/db';

const UUID = /^[0-9a-f-]{36}$/i;

/** Id dari URL → id valid atau null (mencegah query dengan sampah). */
export const asId = (value: string) => (UUID.test(value) ? value : null);

export async function contentCounts() {
  const db = await getDb();
  const one = async (table: PgTable) => {
    const [r] = await db.select({ n: count() }).from(table);
    return r.n;
  };
  const [news, events, albums, documents, board, achievements] = await Promise.all([
    one(schema.news),
    one(schema.events),
    one(schema.albums),
    one(schema.documents),
    one(schema.boardMembers),
    one(schema.achievements),
  ]);
  const [{ draftNews }] = await db
    .select({ draftNews: count() })
    .from(schema.news)
    .where(eq(schema.news.status, 'DRAFT'));
  return { news, events, albums, documents, board, achievements, draftNews };
}

export const listNewsAdmin = async () => {
  const db = await getDb();
  return db.select().from(schema.news).orderBy(desc(schema.news.updatedAt));
};

export const getNewsAdmin = async (id: string) => {
  const db = await getDb();
  const [row] = await db.select().from(schema.news).where(eq(schema.news.id, id)).limit(1);
  return row ?? null;
};

export const listEventsAdmin = async () => {
  const db = await getDb();
  return db.select().from(schema.events).orderBy(desc(schema.events.dateStart));
};

export const getEventAdmin = async (id: string) => {
  const db = await getDb();
  const [row] = await db.select().from(schema.events).where(eq(schema.events.id, id)).limit(1);
  return row ?? null;
};

export const listAlbumsAdmin = async () => {
  const db = await getDb();
  return db
    .select({
      album: schema.albums,
      photoCount: sql<number>`(select count(*)::int from ${schema.photos} where ${schema.photos.albumId} = ${schema.albums.id})`,
    })
    .from(schema.albums)
    .orderBy(desc(schema.albums.date));
};

export const getAlbumAdmin = async (id: string) => {
  const db = await getDb();
  const [album] = await db.select().from(schema.albums).where(eq(schema.albums.id, id)).limit(1);
  if (!album) return null;
  const photos = await db.select().from(schema.photos).where(eq(schema.photos.albumId, id)).orderBy(asc(schema.photos.sortOrder));
  return { album, photos };
};

export const listDocumentsAdmin = async () => {
  const db = await getDb();
  return db.select().from(schema.documents).orderBy(desc(schema.documents.date));
};

export const getDocumentAdmin = async (id: string) => {
  const db = await getDb();
  const [row] = await db.select().from(schema.documents).where(eq(schema.documents.id, id)).limit(1);
  return row ?? null;
};

export const listBoardAdmin = async () => {
  const db = await getDb();
  return db.select().from(schema.boardMembers).orderBy(asc(schema.boardMembers.sortOrder), asc(schema.boardMembers.name));
};

export const getBoardAdmin = async (id: string) => {
  const db = await getDb();
  const [row] = await db.select().from(schema.boardMembers).where(eq(schema.boardMembers.id, id)).limit(1);
  return row ?? null;
};

export const listAchievementsAdmin = async () => {
  const db = await getDb();
  return db.select().from(schema.achievements).orderBy(desc(schema.achievements.year), asc(schema.achievements.title));
};

export const getAchievementAdmin = async (id: string) => {
  const db = await getDb();
  const [row] = await db.select().from(schema.achievements).where(eq(schema.achievements.id, id)).limit(1);
  return row ?? null;
};
