'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, schema } from '@/db';
import { audit } from '@/lib/auth/audit';
import { requirePermission } from '@/lib/auth/session';
import { checkbox, fail, parseForm, requiredText, type FormState } from '@/lib/forms';
import { deleteMedia } from '@/lib/storage';
import { resolveCover, uniqueSlug } from './shared';

/**
 * Kontributor (staf gudep/kwarran) menulis berita, tetapi TIDAK PERNAH bisa menerbitkannya:
 * status yang diterima hanya DRAFT atau REVIEW, dan hanya berita miliknya yang belum terbit
 * yang bisa disunting (V5 §24). Penerbitan tetap di tangan editor Kwarcab (content.manage).
 */
const ContributionSchema = z.object({
  title: requiredText('Judul', 180),
  category: requiredText('Kategori', 60),
  excerpt: requiredText('Ringkasan', 300),
  content: requiredText('Isi berita', 20000),
  author: requiredText('Penulis', 120),
  status: z.enum(['DRAFT', 'REVIEW'], { errorMap: () => ({ message: 'Pilih simpan draf atau kirim untuk review.' }) }),
  tags: z.union([z.string(), z.undefined()]).transform((s) =>
    (s ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 10),
  ),
  removeCover: checkbox,
});

export async function saveContributionAction(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission('content.contribute');
  const parsed = parseForm(ContributionSchema, formData);
  if (parsed.error) return parsed.error;
  const v = parsed.data;
  const db = await getDb();

  const existing = id
    ? (
        await db
          .select()
          .from(schema.news)
          .where(and(eq(schema.news.id, id), eq(schema.news.createdById, user.id), inArray(schema.news.status, ['DRAFT', 'REVIEW'])))
          .limit(1)
      )[0]
    : undefined;
  if (id && !existing) return fail('Berita tidak ditemukan, bukan milik Anda, atau sudah terbit.');

  const cover = await resolveCover(formData, existing?.coverImage ?? null, v.removeCover);
  if ('error' in cover) return fail(cover.error, { cover: cover.error });

  const values = {
    title: v.title,
    category: v.category,
    excerpt: v.excerpt,
    content: v.content,
    author: v.author,
    tags: v.tags,
    status: v.status,
    coverImage: cover.url,
    // Mengirim ulang setelah diperbaiki: catatan lama dianggap sudah ditindaklanjuti.
    reviewNote: v.status === 'REVIEW' ? null : (existing?.reviewNote ?? null),
  };

  let newsId = id;
  if (existing) {
    await db.update(schema.news).set(values).where(eq(schema.news.id, existing.id));
  } else {
    const slug = await uniqueSlug(schema.news, schema.news.slug, schema.news.id, v.title);
    const [row] = await db
      .insert(schema.news)
      .values({ ...values, slug, createdById: user.id })
      .returning({ id: schema.news.id });
    newsId = row.id;
  }
  await audit(user, {
    action: v.status === 'REVIEW' ? 'content.submit' : 'content.draft',
    summary: `${v.status === 'REVIEW' ? 'Mengirim untuk review' : 'Menyimpan draf'} berita "${v.title}"`,
    entityType: 'news',
    entityId: newsId!,
  });
  revalidatePath('/dashboard/kontribusi');
  revalidatePath('/dashboard/konten/berita');
  redirect(`/dashboard/kontribusi?${v.status === 'REVIEW' ? 'terkirim' : 'tersimpan'}=1`);
}

/** Hapus draf milik sendiri (bukan yang sedang direview atau sudah terbit). */
export async function deleteContributionAction(id: string): Promise<void> {
  const user = await requirePermission('content.contribute');
  const db = await getDb();
  const [row] = await db
    .delete(schema.news)
    .where(and(eq(schema.news.id, id), eq(schema.news.createdById, user.id), eq(schema.news.status, 'DRAFT')))
    .returning({ title: schema.news.title, coverImage: schema.news.coverImage });
  if (row) await deleteMedia(row.coverImage);
  if (row)
    await audit(user, { action: 'content.delete', summary: `Menghapus draf berita "${row.title}"`, entityType: 'news', entityId: id });
  revalidatePath('/dashboard/kontribusi');
  redirect('/dashboard/kontribusi?dihapus=1');
}
