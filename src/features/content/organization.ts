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

/* ---------------- Pengurus (Struktur Organisasi) ---------------- */

const BoardSchema = z.object({
  name: requiredText('Nama', 150),
  position: requiredText('Jabatan', 150),
  department: requiredText('Bidang', 100),
  period: requiredText('Masa bakti', 30),
  sortOrder: z.coerce.number({ invalid_type_error: 'Urutan harus angka.' }).int().min(0).max(999),
});

export async function saveBoardMemberAction(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission('content.manage');
  const parsed = parseForm(BoardSchema, formData);
  if (parsed.error) return parsed.error;
  const db = await getDb();
  if (id) {
    const [row] = await db.update(schema.boardMembers).set(parsed.data).where(eq(schema.boardMembers.id, id)).returning({ id: schema.boardMembers.id });
    if (!row) return fail('Data pengurus tidak ditemukan.');
  } else {
    const [row] = await db.insert(schema.boardMembers).values(parsed.data).returning({ id: schema.boardMembers.id });
    id = row.id;
  }
  await audit(user, { action: 'content.save', summary: `Menyimpan pengurus ${parsed.data.name} (${parsed.data.position})`, entityType: 'board', entityId: id });
  revalidatePath('/dashboard/konten/pengurus');
  redirect('/dashboard/konten/pengurus?tersimpan=1');
}

export async function deleteBoardMemberAction(id: string): Promise<void> {
  const user = await requirePermission('content.manage');
  const db = await getDb();
  const [row] = await db.delete(schema.boardMembers).where(eq(schema.boardMembers.id, id)).returning({ name: schema.boardMembers.name });
  if (row) await audit(user, { action: 'content.delete', summary: `Menghapus pengurus ${row.name}`, entityType: 'board', entityId: id });
  revalidatePath('/dashboard/konten/pengurus');
  redirect('/dashboard/konten/pengurus?dihapus=1');
}

/* ---------------- Prestasi ---------------- */

const AchievementSchema = z.object({
  title: requiredText('Nama prestasi', 200),
  level: z.string().refine((v) => ACHIEVEMENT_LEVEL_OPTIONS.includes(v), 'Tingkat wajib dipilih.'),
  year: z.coerce.number({ invalid_type_error: 'Tahun harus angka.' }).int().min(1961, 'Tahun tidak valid.').max(new Date().getFullYear() + 1, 'Tahun tidak valid.'),
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
    const [row] = await db.update(schema.achievements).set(parsed.data).where(eq(schema.achievements.id, id)).returning({ id: schema.achievements.id });
    if (!row) return fail('Prestasi tidak ditemukan.');
  } else {
    const [row] = await db.insert(schema.achievements).values(parsed.data).returning({ id: schema.achievements.id });
    id = row.id;
  }
  await audit(user, { action: 'content.save', summary: `Menyimpan prestasi "${parsed.data.title}"`, entityType: 'achievement', entityId: id });
  revalidatePath('/dashboard/konten/prestasi');
  redirect('/dashboard/konten/prestasi?tersimpan=1');
}

export async function deleteAchievementAction(id: string): Promise<void> {
  const user = await requirePermission('content.manage');
  const db = await getDb();
  const [row] = await db.delete(schema.achievements).where(eq(schema.achievements.id, id)).returning({ title: schema.achievements.title });
  if (row) await audit(user, { action: 'content.delete', summary: `Menghapus prestasi "${row.title}"`, entityType: 'achievement', entityId: id });
  revalidatePath('/dashboard/konten/prestasi');
  redirect('/dashboard/konten/prestasi?dihapus=1');
}
