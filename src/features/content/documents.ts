'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, schema } from '@/db';
import { audit } from '@/lib/auth/audit';
import { requirePermission } from '@/lib/auth/session';
import { checkbox, fail, isoDate, optionalText, parseForm, requiredText, type FormState } from '@/lib/forms';
import { UploadError, deleteMedia, isFile, saveDocument } from '@/lib/storage';

const DocumentSchema = z.object({
  title: requiredText('Judul dokumen', 200),
  category: requiredText('Kategori', 60),
  description: optionalText(500),
  date: isoDate('Tanggal dokumen'),
  published: checkbox,
});

export async function saveDocumentAction(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission('content.manage');
  const parsed = parseForm(DocumentSchema, formData);
  if (parsed.error) return parsed.error;
  const v = parsed.data;
  const db = await getDb();

  const existing = id ? (await db.select().from(schema.documents).where(eq(schema.documents.id, id)).limit(1))[0] : undefined;
  if (id && !existing) return fail('Dokumen tidak ditemukan.');

  let file: { fileUrl: string | null; fileType: string; fileSize: number | null } = {
    fileUrl: existing?.fileUrl ?? null,
    fileType: existing?.fileType ?? 'PDF',
    fileSize: existing?.fileSize ?? null,
  };
  const upload = formData.get('file');
  if (isFile(upload)) {
    try {
      const saved = await saveDocument(upload);
      await deleteMedia(existing?.fileUrl);
      file = { fileUrl: saved.url, fileType: saved.type, fileSize: saved.size };
    } catch (e) {
      if (e instanceof UploadError) return fail(e.message, { file: e.message });
      throw e;
    }
  }
  if (v.published && !file.fileUrl) {
    return fail('Unggah berkas sebelum menayangkan dokumen.', { file: 'Berkas wajib ada untuk dokumen yang tayang.' });
  }

  if (existing) {
    await db.update(schema.documents).set({ ...v, ...file }).where(eq(schema.documents.id, existing.id));
  } else {
    const [row] = await db.insert(schema.documents).values({ ...v, ...file }).returning({ id: schema.documents.id });
    id = row.id;
  }
  await audit(user, { action: 'content.save', summary: `Menyimpan dokumen "${v.title}"${v.published ? ' (tayang)' : ' (draf)'}`, entityType: 'document', entityId: id! });
  revalidatePath('/dashboard/konten/dokumen');
  redirect('/dashboard/konten/dokumen?tersimpan=1');
}

export async function deleteDocumentAction(id: string): Promise<void> {
  const user = await requirePermission('content.manage');
  const db = await getDb();
  const [row] = await db.delete(schema.documents).where(eq(schema.documents.id, id)).returning();
  if (row) {
    await deleteMedia(row.fileUrl);
    await audit(user, { action: 'content.delete', summary: `Menghapus dokumen "${row.title}"`, entityType: 'document', entityId: id });
  }
  revalidatePath('/dashboard/konten/dokumen');
  redirect('/dashboard/konten/dokumen?dihapus=1');
}
