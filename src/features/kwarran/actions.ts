'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, schema } from '@/db';
import { audit } from '@/lib/auth/audit';
import { requirePermission } from '@/lib/auth/session';
import { fail, optionalCoordinate, optionalText, parseForm, phone, type FormState } from '@/lib/forms';

const KwarranSchema = z.object({
  code: optionalText(30),
  leaderName: optionalText(120),
  phone,
  address: optionalText(300),
  lat: optionalCoordinate,
  lng: optionalCoordinate,
});

/** Nama kwarran = nama kecamatan dan tidak dapat diubah di sini (menjaga konsistensi 31 kecamatan). */
export async function updateKwarranAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission('kwarran.manage');
  const parsed = parseForm(KwarranSchema, formData);
  if (parsed.error) return parsed.error;
  if ((parsed.data.lat === null) !== (parsed.data.lng === null)) {
    return fail('Periksa kembali isian yang ditandai.', { lat: 'Isi lintang dan bujur sekaligus.' });
  }
  const db = await getDb();
  const [row] = await db.update(schema.kwarran).set(parsed.data).where(eq(schema.kwarran.id, id)).returning({ name: schema.kwarran.name });
  if (!row) return fail('Kwarran tidak ditemukan.');
  await audit(user, { action: 'kwarran.update', summary: `Mengubah data Kwarran ${row.name}`, entityType: 'kwarran', entityId: id });
  revalidatePath('/dashboard/kwarran');
  redirect('/dashboard/kwarran?tersimpan=1');
}
