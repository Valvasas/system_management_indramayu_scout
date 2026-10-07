'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, schema } from '@/db';
import { audienceEnum } from '@/db/schema';
import { audit } from '@/lib/auth/audit';
import { canAccessGudep } from '@/lib/auth/scope';
import { requirePermission } from '@/lib/auth/session';
import { fail, parseForm, requiredText, type FormState } from '@/lib/forms';
import { canTargetWholeKwarcab } from './queries';

const AnnouncementSchema = z.object({
  title: requiredText('Judul', 160),
  body: requiredText('Isi pengumuman', 3000),
  audience: z.enum(audienceEnum.enumValues),
  gudepId: z.union([z.string(), z.undefined()]).transform((v) => (v && /^[0-9a-f-]{36}$/i.test(v) ? v : null)),
});

export async function createAnnouncementAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission('announcements.manage');
  const parsed = parseForm(AnnouncementSchema, formData);
  if (parsed.error) return parsed.error;
  const v = parsed.data;

  // Staf gudep selalu ke gudepnya; staf kwarran wajib memilih gudep di wilayahnya.
  const gudepId = user.role === 'STAFF_GUDEP' ? user.gudepId : v.gudepId;
  if (!gudepId && !canTargetWholeKwarcab(user)) return fail('Pilih gudep tujuan.', { gudepId: 'Pilih gudep di wilayah Anda.' });
  if (gudepId && !canTargetWholeKwarcab(user) && !(await canAccessGudep(user, gudepId))) {
    return fail('Gudep di luar wilayah Anda.', { gudepId: 'Pilih gudep di wilayah Anda.' });
  }

  const db = await getDb();
  const [row] = await db
    .insert(schema.announcements)
    .values({ ...v, gudepId, createdById: user.id, authorName: user.name })
    .returning({ id: schema.announcements.id });
  await audit(user, {
    action: 'announcement.create',
    summary: `Membuat pengumuman "${v.title}"`,
    entityType: 'announcement',
    entityId: row.id,
  });
  revalidatePath('/dashboard/pengumuman');
  redirect('/dashboard/pengumuman?tersimpan=1');
}

export async function deleteAnnouncementAction(id: string): Promise<void> {
  const user = await requirePermission('announcements.manage');
  const db = await getDb();
  const [row] = await db.select().from(schema.announcements).where(eq(schema.announcements.id, id)).limit(1);
  if (!row) redirect('/dashboard/pengumuman');
  const allowed =
    canTargetWholeKwarcab(user) || row.createdById === user.id || (row.gudepId !== null && (await canAccessGudep(user, row.gudepId)));
  if (!allowed) redirect('/dashboard/pengumuman');
  await db.delete(schema.announcements).where(eq(schema.announcements.id, id));
  await audit(user, {
    action: 'announcement.delete',
    summary: `Menghapus pengumuman "${row.title}"`,
    entityType: 'announcement',
    entityId: id,
  });
  revalidatePath('/dashboard/pengumuman');
  redirect('/dashboard/pengumuman?dihapus=1');
}
