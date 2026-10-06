'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, max, min } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, schema } from '@/db';
import { audit } from '@/lib/auth/audit';
import { requirePermission } from '@/lib/auth/session';
import { checkbox, fail, isoDate, ok, optionalText, parseForm, requiredText, type FormState } from '@/lib/forms';
import { UploadError, deleteMedia, isFile, saveImage } from '@/lib/storage';
import { uniqueSlug, revalidatePublicSite } from './shared';

const AlbumSchema = z.object({
  title: requiredText('Judul album', 180),
  date: isoDate('Tanggal kegiatan'),
  location: requiredText('Lokasi', 200),
  organizer: requiredText('Penyelenggara', 150),
  category: requiredText('Kategori', 60),
  description: optionalText(2000).transform((s) => s ?? ''),
  published: checkbox,
});

export async function saveAlbumAction(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission('content.manage');
  const parsed = parseForm(AlbumSchema, formData);
  if (parsed.error) return parsed.error;
  const v = parsed.data;
  const db = await getDb();

  if (id) {
    const [row] = await db.update(schema.albums).set(v).where(eq(schema.albums.id, id)).returning({ id: schema.albums.id });
    if (!row) return fail('Album tidak ditemukan.');
  } else {
    const slug = await uniqueSlug(schema.albums, schema.albums.slug, schema.albums.id, v.title);
    const [row] = await db
      .insert(schema.albums)
      .values({ ...v, slug })
      .returning({ id: schema.albums.id });
    id = row.id;
  }
  await audit(user, {
    action: 'content.save',
    summary: `Menyimpan album "${v.title}"${v.published ? ' (tayang)' : ' (draf)'}`,
    entityType: 'album',
    entityId: id,
  });
  revalidatePath('/dashboard/konten/galeri');
  revalidatePublicSite();
  redirect(`/dashboard/konten/galeri/${id}?tersimpan=1`);
}

export async function deleteAlbumAction(id: string): Promise<void> {
  const user = await requirePermission('content.manage');
  const db = await getDb();
  const photos = await db.select({ url: schema.photos.url }).from(schema.photos).where(eq(schema.photos.albumId, id));
  const [row] = await db.delete(schema.albums).where(eq(schema.albums.id, id)).returning({ title: schema.albums.title });
  if (row) {
    for (const p of photos) await deleteMedia(p.url);
    await audit(user, {
      action: 'content.delete',
      summary: `Menghapus album "${row.title}" beserta ${photos.length} foto`,
      entityType: 'album',
      entityId: id,
    });
  }
  revalidatePath('/dashboard/konten/galeri');
  revalidatePublicSite();
  redirect('/dashboard/konten/galeri?dihapus=1');
}

const MAX_PHOTOS_PER_UPLOAD = 20;

export async function uploadPhotosAction(albumId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission('content.manage');
  const db = await getDb();
  const [album] = await db.select().from(schema.albums).where(eq(schema.albums.id, albumId)).limit(1);
  if (!album) return fail('Album tidak ditemukan.');

  const files = formData.getAll('photos').filter(isFile);
  if (files.length === 0) return fail('Pilih minimal satu foto.', { photos: 'Pilih foto dari perangkat Anda.' });
  if (files.length > MAX_PHOTOS_PER_UPLOAD) return fail(`Maksimal ${MAX_PHOTOS_PER_UPLOAD} foto sekali unggah.`);
  if (formData.get('consent') !== 'on') {
    return fail('Konfirmasi dulu bahwa foto aman dipublikasikan.', { consent: 'Wajib dicentang sebelum mengunggah.' });
  }
  const caption = String(formData.get('caption') ?? '')
    .trim()
    .slice(0, 200);

  const [{ last }] = await db
    .select({ last: max(schema.photos.sortOrder) })
    .from(schema.photos)
    .where(eq(schema.photos.albumId, albumId));
  let order = (last ?? 0) + 1;
  const failed: string[] = [];
  for (const file of files) {
    try {
      const saved = await saveImage(file, 'foto');
      await db.insert(schema.photos).values({
        albumId,
        url: saved.url,
        width: saved.width,
        height: saved.height,
        caption: caption || album.title,
        altText: caption || `Dokumentasi ${album.title}`,
        sortOrder: order++,
      });
    } catch (e) {
      if (e instanceof UploadError) failed.push(`${file.name}: ${e.message}`);
      else throw e;
    }
  }
  const okCount = files.length - failed.length;
  if (okCount)
    await audit(user, {
      action: 'content.upload',
      summary: `Mengunggah ${okCount} foto ke album "${album.title}"`,
      entityType: 'album',
      entityId: albumId,
    });
  revalidatePath(`/dashboard/konten/galeri/${albumId}`);
  revalidatePublicSite();
  return failed.length
    ? fail(`${okCount} foto tersimpan, ${failed.length} gagal:\n${failed.join('\n')}`)
    : ok(`${okCount} foto tersimpan. Metadata lokasi (GPS) pada foto otomatis dihapus.`);
}

const PhotoSchema = z.object({
  caption: requiredText('Keterangan', 200),
  altText: requiredText('Teks alternatif', 250),
});

export async function updatePhotoAction(photoId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requirePermission('content.manage');
  const parsed = parseForm(PhotoSchema, formData);
  if (parsed.error) return parsed.error;
  const db = await getDb();
  const [row] = await db
    .update(schema.photos)
    .set(parsed.data)
    .where(eq(schema.photos.id, photoId))
    .returning({ albumId: schema.photos.albumId });
  if (!row) return fail('Foto tidak ditemukan.');
  revalidatePath(`/dashboard/konten/galeri/${row.albumId}`);
  revalidatePublicSite();
  return ok('Keterangan foto tersimpan.');
}

export async function deletePhotoAction(photoId: string): Promise<void> {
  const user = await requirePermission('content.manage');
  const db = await getDb();
  const [row] = await db.delete(schema.photos).where(eq(schema.photos.id, photoId)).returning();
  if (!row) redirect('/dashboard/konten/galeri');
  await deleteMedia(row.url);
  await audit(user, { action: 'content.delete', summary: 'Menghapus satu foto galeri', entityType: 'album', entityId: row.albumId });
  revalidatePath(`/dashboard/konten/galeri/${row.albumId}`);
  revalidatePublicSite();
  redirect(`/dashboard/konten/galeri/${row.albumId}?foto=dihapus`);
}

/** Jadikan foto sebagai sampul album (urutan pertama). */
export async function setCoverPhotoAction(photoId: string): Promise<void> {
  await requirePermission('content.manage');
  const db = await getDb();
  const [photo] = await db.select().from(schema.photos).where(eq(schema.photos.id, photoId)).limit(1);
  if (!photo) redirect('/dashboard/konten/galeri');
  const [{ first }] = await db
    .select({ first: min(schema.photos.sortOrder) })
    .from(schema.photos)
    .where(and(eq(schema.photos.albumId, photo.albumId)));
  await db
    .update(schema.photos)
    .set({ sortOrder: (first ?? 0) - 1 })
    .where(eq(schema.photos.id, photoId));
  revalidatePath(`/dashboard/konten/galeri/${photo.albumId}`);
  revalidatePublicSite();
  redirect(`/dashboard/konten/galeri/${photo.albumId}?foto=sampul`);
}
