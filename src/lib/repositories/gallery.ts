import { asc, desc, eq, inArray } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import type { AlbumRow } from '@/db/schema';
import type { GalleryAlbum, Photo } from '@/types';

async function withPhotos(albums: AlbumRow[]): Promise<GalleryAlbum[]> {
  if (albums.length === 0) return [];
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.photos)
    .where(
      inArray(
        schema.photos.albumId,
        albums.map((a) => a.id),
      ),
    )
    .orderBy(asc(schema.photos.sortOrder), asc(schema.photos.createdAt));

  const byAlbum = new Map<string, Photo[]>();
  for (const p of rows) {
    const list = byAlbum.get(p.albumId) ?? [];
    list.push({ id: p.id, url: p.url, caption: p.caption, altText: p.altText || p.caption });
    byAlbum.set(p.albumId, list);
  }

  return albums.map((a) => {
    const photos = byAlbum.get(a.id) ?? [];
    return {
      id: a.id,
      slug: a.slug,
      title: a.title,
      date: a.date,
      location: a.location,
      organizer: a.organizer,
      description: a.description,
      category: a.category,
      coverImage: photos[0]?.url ?? '',
      photos,
    };
  });
}

export async function getGalleryAlbums(limit?: number): Promise<GalleryAlbum[]> {
  const db = await getDb();
  const query = db
    .select()
    .from(schema.albums)
    .where(eq(schema.albums.published, true))
    .orderBy(desc(schema.albums.date));
  const albums = typeof limit === 'number' ? await query.limit(limit) : await query;
  return withPhotos(albums);
}

export async function getGalleryAlbumBySlug(slug: string): Promise<GalleryAlbum | null> {
  const db = await getDb();
  const [album] = await db.select().from(schema.albums).where(eq(schema.albums.slug, slug)).limit(1);
  if (!album || !album.published) return null;
  return (await withPhotos([album]))[0];
}

export async function getGalleryAlbumSlugs(): Promise<string[]> {
  return (await getGalleryAlbums()).map((a) => a.slug);
}
