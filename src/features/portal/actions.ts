'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { audit } from '@/lib/auth/audit';
import { requirePermission } from '@/lib/auth/session';
import { getOwnMember } from './peserta';

/** Peserta mendaftar kegiatan. Syarat: anggota aktif, kegiatan tayang, pendaftaran dibuka, belum lewat. */
export async function registerEventAction(eventId: string): Promise<void> {
  const user = await requirePermission('self.portal');
  const own = await getOwnMember(user);
  if (!own || own.m.status !== 'ACTIVE') redirect('/dashboard/kegiatan?gagal=status');

  const db = await getDb();
  const [event] = await db.select().from(schema.events).where(eq(schema.events.id, eventId)).limit(1);
  if (!event || !event.published || event.cancelled || !event.registrationOpen || event.dateStart < new Date()) {
    redirect('/dashboard/kegiatan?gagal=tutup');
  }
  await db.insert(schema.eventRegistrations).values({ eventId, memberId: own.m.id }).onConflictDoNothing();
  await audit(user, { action: 'event.register', summary: `Mendaftar kegiatan "${event.title}"`, entityType: 'event', entityId: eventId });
  revalidatePath('/dashboard/kegiatan');
  redirect('/dashboard/kegiatan?daftar=1');
}

export async function cancelRegistrationAction(eventId: string): Promise<void> {
  const user = await requirePermission('self.portal');
  if (!user.memberId) redirect('/dashboard/kegiatan');
  const db = await getDb();
  const [event] = await db.select({ title: schema.events.title, dateStart: schema.events.dateStart }).from(schema.events).where(eq(schema.events.id, eventId)).limit(1);
  if (!event || event.dateStart < new Date()) redirect('/dashboard/kegiatan?gagal=lewat');
  await db
    .delete(schema.eventRegistrations)
    .where(and(eq(schema.eventRegistrations.eventId, eventId), eq(schema.eventRegistrations.memberId, user.memberId)));
  await audit(user, { action: 'event.unregister', summary: `Membatalkan pendaftaran "${event.title}"`, entityType: 'event', entityId: eventId });
  revalidatePath('/dashboard/kegiatan');
  redirect('/dashboard/kegiatan?batal=1');
}
