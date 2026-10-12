'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/session';
import { fail, ok, type FormState } from '@/lib/forms';
import { InboxQuerySchema, openNotification, savePreferences } from './inbox';
import { markAllRead } from './notify';

const BASE = '/dashboard/notifikasi';

/** Argumen terikat (.bind) datang dari peramban: divalidasi ulang di server. */
const OpenArgsSchema = z.object({ id: z.string().uuid().catch(''), halaman: z.unknown(), tampil: z.unknown() });

function backTo(page: unknown, filter: unknown, extra: string): string {
  const q = InboxQuerySchema.parse({ halaman: page, tampil: filter });
  const params = new URLSearchParams();
  if (q.halaman > 1) params.set('halaman', String(q.halaman));
  if (q.tampil !== 'semua') params.set('tampil', q.tampil);
  params.set(extra, '1');
  return `${BASE}?${params.toString()}`;
}

/**
 * Tandai satu notifikasi dibaca lalu buka tautannya (bila ada). Pemilik diambil dari SESI:
 * id milik orang lain (diubah di peramban) diperlakukan sama dengan id yang tidak ada.
 */
export async function openNotificationAction(id: string, page: number, filter: string): Promise<void> {
  const user = await requireUser();
  const args = OpenArgsSchema.parse({ id, halaman: page, tampil: filter });
  const result = args.id ? await openNotification(user.id, args.id) : null;
  // Lencana belum dibaca ada di layout portal: segarkan seluruh layout.
  revalidatePath('/dashboard', 'layout');
  if (!result) redirect(backTo(args.halaman, args.tampil, 'tidak-ditemukan'));
  redirect(result.href ?? backTo(args.halaman, args.tampil, 'dibaca'));
}

export async function markAllReadAction(): Promise<void> {
  const user = await requireUser();
  await markAllRead(user.id);
  revalidatePath('/dashboard', 'layout');
  redirect(`${BASE}?semua-dibaca=1`);
}

export async function savePreferencesAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const result = await savePreferences(user, formData);
  if (!result.ok) return fail('Preferensi tidak dapat dibaca. Muat ulang halaman, lalu coba lagi.');
  revalidatePath(BASE);
  return ok('Preferensi notifikasi tersimpan.');
}
