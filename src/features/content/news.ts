'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, schema } from '@/db';
import { publishStatusEnum } from '@/db/schema';
import { audit } from '@/lib/auth/audit';
import { requirePermission } from '@/lib/auth/session';
import { checkbox, fail, optionalIsoDate, parseForm, requiredText, type FormState } from '@/lib/forms';
import { UploadError, deleteMedia, isFile, saveImage } from '@/lib/storage';
import { uniqueSlug, revalidatePublicSite } from './shared';

const NewsSchema = z.object({
  title: requiredText('Judul', 180),
  category: requiredText('Kategori', 60),
  excerpt: requiredText('Ringkasan', 300),
  content: requiredText('Isi berita', 20000),
  author: requiredText('Penulis', 120),
  status: z.enum(publishStatusEnum.enumValues),
  publishedAt: optionalIsoDate,
  tags: z
    .union([z.string(), z.undefined()])
    .transform((s) => (s ?? '').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 10)),
  removeCover: checkbox,
});

export async function saveNewsAction(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission('content.manage');
  const parsed = parseForm(NewsSchema, formData);
  if (parsed.error) return parsed.error;
  const v = parsed.data;
  const db = await getDb();

  const existing = id ? (await db.select().from(schema.news).where(eq(schema.news.id, id)).limit(1))[0] : undefined;
  if (id && !existing) return fail('Berita tidak ditemukan.');

  let coverImage = existing?.coverImage ?? null;
  const file = formData.get('cover');
  try {
    if (isFile(file)) {
      const saved = await saveImage(file, 'berita');
      await deleteMedia(coverImage);
      coverImage = saved.url;
    } else if (v.removeCover) {
      await deleteMedia(coverImage);
      coverImage = null;
    }
  } catch (e) {
    if (e instanceof UploadError) return fail(e.message, { cover: e.message });
    throw e;
  }

  const publishedAt =
    v.status === 'PUBLISHED'
      ? v.publishedAt
        ? new Date(`${v.publishedAt}T08:00:00+07:00`)
        : (existing?.publishedAt ?? new Date())
      : (existing?.publishedAt ?? null);

  const values = {
    title: v.title,
    category: v.category,
    excerpt: v.excerpt,
    content: v.content,
    author: v.author,
    status: v.status,
    tags: v.tags,
    coverImage,
    publishedAt,
  };

  let newsId = id;
  if (existing) {
    await db.update(schema.news).set(values).where(eq(schema.news.id, existing.id));
  } else {
    const slug = await uniqueSlug(schema.news, schema.news.slug, schema.news.id, v.title);
    const [row] = await db.insert(schema.news).values({ ...values, slug, createdById: user.id }).returning({ id: schema.news.id });
    newsId = row.id;
  }

  const published = v.status === 'PUBLISHED' && existing?.status !== 'PUBLISHED';
  await audit(user, {
    action: existing ? (published ? 'content.publish' : 'content.update') : 'content.create',
    summary: `${existing ? (published ? 'Menerbitkan' : 'Mengubah') : 'Membuat'} berita "${v.title}"`,
    entityType: 'news',
    entityId: newsId!,
  });
  revalidatePath('/dashboard/konten/berita');
  revalidatePublicSite();
  redirect('/dashboard/konten/berita?tersimpan=1');
}

export async function deleteNewsAction(id: string): Promise<void> {
  const user = await requirePermission('content.manage');
  const db = await getDb();
  const [row] = await db.delete(schema.news).where(eq(schema.news.id, id)).returning();
  if (row) {
    await deleteMedia(row.coverImage);
    await audit(user, { action: 'content.delete', summary: `Menghapus berita "${row.title}"`, entityType: 'news', entityId: id });
  }
  revalidatePath('/dashboard/konten/berita');
  revalidatePublicSite();
  redirect('/dashboard/konten/berita?dihapus=1');
}
