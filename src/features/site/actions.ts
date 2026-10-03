'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq, sql } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { audit } from '@/lib/auth/audit';
import { requirePermission } from '@/lib/auth/session';
import { fail, ok, type FormState } from '@/lib/forms';
import { getSiteAppearance } from '@/lib/repositories/settings';
import { UploadError, deleteMedia, isFile, saveImage } from '@/lib/storage';

async function setSetting(key: string, value: string | null) {
  const db = await getDb();
  const json = sql`${JSON.stringify(value ?? '')}::jsonb`;
  await db
    .insert(schema.siteSettings)
    .values({ key, value: json })
    .onConflictDoUpdate({ target: schema.siteSettings.key, set: { value: json } });
}

export async function saveAppearanceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission('settings.manage');
  const current = await getSiteAppearance();
  const alt = String(formData.get('heroImageAlt') ?? '').trim().slice(0, 200);
  const caption = String(formData.get('heroCaption') ?? '').trim().slice(0, 120);

  const file = formData.get('heroImage');
  if (isFile(file)) {
    if (formData.get('consent') !== 'on') {
      return fail('Konfirmasi dulu bahwa foto aman dipublikasikan.', { consent: 'Wajib dicentang sebelum mengganti foto.' });
    }
    try {
      const saved = await saveImage(file, 'situs');
      if (saved.width < 1200) {
        await deleteMedia(saved.url);
        return fail('Foto terlalu kecil untuk header. Gunakan foto lebar minimal 1200 piksel.', { heroImage: 'Minimal lebar 1200 piksel.' });
      }
      await deleteMedia(current.heroImage);
      await setSetting('heroImage', saved.url);
    } catch (e) {
      if (e instanceof UploadError) return fail(e.message, { heroImage: e.message });
      throw e;
    }
  } else if (formData.get('removeHero') === 'on') {
    await deleteMedia(current.heroImage);
    await setSetting('heroImage', null);
  }
  if (alt) await setSetting('heroImageAlt', alt);
  await setSetting('heroCaption', caption);

  await audit(user, { action: 'settings.update', summary: 'Mengubah tampilan header beranda' });
  revalidatePath('/');
  revalidatePath('/dashboard/pengaturan');
  return ok('Tampilan beranda tersimpan. Buka beranda untuk melihat hasilnya.');
}

/* ---------------- Pesan masuk (formulir Kontak) ---------------- */

export async function markMessageReadAction(id: string): Promise<void> {
  await requirePermission('messages.read');
  const db = await getDb();
  await db.update(schema.contactMessages).set({ readAt: new Date() }).where(eq(schema.contactMessages.id, id));
  revalidatePath('/dashboard/pesan');
  redirect('/dashboard/pesan');
}

export async function deleteMessageAction(id: string): Promise<void> {
  const user = await requirePermission('messages.read');
  const db = await getDb();
  const [row] = await db.delete(schema.contactMessages).where(eq(schema.contactMessages.id, id)).returning({ name: schema.contactMessages.name });
  if (row) await audit(user, { action: 'message.delete', summary: `Menghapus pesan dari ${row.name}`, entityType: 'message', entityId: id });
  revalidatePath('/dashboard/pesan');
  redirect('/dashboard/pesan?dihapus=1');
}
