'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, schema } from '@/db';
import { audit } from '@/lib/auth/audit';
import { requirePermission } from '@/lib/auth/session';
import { checkbox, fail, optionalText, parseForm, requiredText, type FormState } from '@/lib/forms';
import { parseLocalDateTime, uniqueSlug, revalidatePublicSite } from './shared';

const EventSchema = z
  .object({
    title: requiredText('Nama kegiatan', 180),
    dateStart: z.string().transform((s, ctx) => {
      const d = parseLocalDateTime(s.trim());
      if (!d) ctx.addIssue({ code: 'custom', message: 'Tanggal & jam mulai wajib diisi.' });
      return d as Date;
    }),
    dateEnd: z.string().optional().transform((s) => (s ? parseLocalDateTime(s.trim()) : null)),
    location: requiredText('Lokasi', 200),
    organizer: requiredText('Penyelenggara', 150),
    description: requiredText('Deskripsi', 5000),
    contactPerson: optionalText(150),
    published: checkbox,
    cancelled: checkbox,
    registrationOpen: checkbox,
  })
  .superRefine((v, ctx) => {
    if (v.dateStart && v.dateEnd && v.dateEnd < v.dateStart) {
      ctx.addIssue({ code: 'custom', path: ['dateEnd'], message: 'Waktu selesai harus setelah waktu mulai.' });
    }
  });

export async function saveEventAction(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission('content.manage');
  const parsed = parseForm(EventSchema, formData);
  if (parsed.error) return parsed.error;
  const v = parsed.data;
  const db = await getDb();

  if (id) {
    const [row] = await db.update(schema.events).set(v).where(eq(schema.events.id, id)).returning({ id: schema.events.id });
    if (!row) return fail('Agenda tidak ditemukan.');
  } else {
    const slug = await uniqueSlug(schema.events, schema.events.slug, schema.events.id, v.title);
    const [row] = await db.insert(schema.events).values({ ...v, slug, createdById: user.id }).returning({ id: schema.events.id });
    id = row.id;
  }
  await audit(user, { action: 'content.save', summary: `Menyimpan agenda "${v.title}"${v.published ? ' (tayang)' : ' (draf)'}`, entityType: 'event', entityId: id });
  revalidatePath('/dashboard/konten/agenda');
  revalidatePublicSite();
  redirect('/dashboard/konten/agenda?tersimpan=1');
}

export async function deleteEventAction(id: string): Promise<void> {
  const user = await requirePermission('content.manage');
  const db = await getDb();
  const [row] = await db.delete(schema.events).where(eq(schema.events.id, id)).returning({ title: schema.events.title });
  if (row) await audit(user, { action: 'content.delete', summary: `Menghapus agenda "${row.title}"`, entityType: 'event', entityId: id });
  revalidatePath('/dashboard/konten/agenda');
  revalidatePublicSite();
  redirect('/dashboard/konten/agenda?dihapus=1');
}
