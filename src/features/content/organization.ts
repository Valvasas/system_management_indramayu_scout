'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, schema } from '@/db';
import { audit } from '@/lib/auth/audit';
import { requirePermission } from '@/lib/auth/session';
import { ACHIEVEMENT_LEVEL_OPTIONS } from '@/lib/domain';
import { checkbox, fail, optionalText, parseForm, requiredText, type FormState } from '@/lib/forms';
import { deleteBoardMember, saveBoardMember } from '@/features/terms/board';
import { revalidatePublicSite } from './shared';

/* ---------------- Pengurus (Struktur Organisasi) ---------------- */

/**
 * Logika & validasi (termasuk masa jabatan, 2.4) ada di features/terms/board.ts agar bisa diuji;
 * di sini hanya izin sesi, audit, dan pembuangan cache situs publik.
 */
export async function saveBoardMemberAction(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission('content.manage');
  const result = await saveBoardMember(user, id, formData);
  if (!result.ok) return result.state;
  await audit(user, {
    action: 'content.save',
    summary: `Menyimpan pengurus ${result.name} (${result.position})`,
    entityType: 'board',
    entityId: result.id,
  });
  revalidatePath('/dashboard/konten/pengurus');
  revalidatePublicSite();
  redirect('/dashboard/konten/pengurus?tersimpan=1');
}

export async function deleteBoardMemberAction(id: string): Promise<void> {
  const user = await requirePermission('content.manage');
  const result = await deleteBoardMember(user, id);
  if (result.ok)
    await audit(user, { action: 'content.delete', summary: `Menghapus pengurus ${result.name}`, entityType: 'board', entityId: id });
  revalidatePath('/dashboard/konten/pengurus');
  revalidatePublicSite();
  redirect('/dashboard/konten/pengurus?dihapus=1');
}

/* ---------------- Prestasi ---------------- */

const AchievementSchema = z.object({
  title: requiredText('Nama prestasi', 200),
  level: z.string().refine((v) => ACHIEVEMENT_LEVEL_OPTIONS.includes(v), 'Tingkat wajib dipilih.'),
  year: z.coerce
    .number({ invalid_type_error: 'Tahun harus angka.' })
    .int()
    .min(1961, 'Tahun tidak valid.')
    .max(new Date().getFullYear() + 1, 'Tahun tidak valid.'),
  recipient: requiredText('Penerima', 200),
  description: optionalText(1000).transform((s) => s ?? ''),
  published: checkbox,
});

export async function saveAchievementAction(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission('content.manage');
  const parsed = parseForm(AchievementSchema, formData);
  if (parsed.error) return parsed.error;
  const db = await getDb();
  if (id) {
    const [row] = await db
      .update(schema.achievements)
      .set(parsed.data)
      .where(eq(schema.achievements.id, id))
      .returning({ id: schema.achievements.id });
    if (!row) return fail('Prestasi tidak ditemukan.');
  } else {
    const [row] = await db.insert(schema.achievements).values(parsed.data).returning({ id: schema.achievements.id });
    id = row.id;
  }
  await audit(user, {
    action: 'content.save',
    summary: `Menyimpan prestasi "${parsed.data.title}"`,
    entityType: 'achievement',
    entityId: id,
  });
  revalidatePath('/dashboard/konten/prestasi');
  revalidatePublicSite();
  redirect('/dashboard/konten/prestasi?tersimpan=1');
}

export async function deleteAchievementAction(id: string): Promise<void> {
  const user = await requirePermission('content.manage');
  const db = await getDb();
  const [row] = await db.delete(schema.achievements).where(eq(schema.achievements.id, id)).returning({ title: schema.achievements.title });
  if (row)
    await audit(user, { action: 'content.delete', summary: `Menghapus prestasi "${row.title}"`, entityType: 'achievement', entityId: id });
  revalidatePath('/dashboard/konten/prestasi');
  revalidatePublicSite();
  redirect('/dashboard/konten/prestasi?dihapus=1');
}
