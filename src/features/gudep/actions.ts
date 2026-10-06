'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, schema } from '@/db';
import { audit } from '@/lib/auth/audit';
import { canAccessGudep, canAccessKwarran } from '@/lib/auth/scope';
import { can, requirePermission } from '@/lib/auth/session';
import { INDRAMAYU_BOUNDS, JENJANG_OPTIONS } from '@/lib/domain';
import { checkbox, fail, optionalCoordinate, optionalText, parseForm, phone, requiredText, uuid, type FormState } from '@/lib/forms';
import { getGudep } from './queries';

const GudepSchema = z
  .object({
    kwarranId: uuid('Kwarran'),
    name: requiredText('Nama gudep', 150),
    number: optionalText(40),
    pangkalan: optionalText(150),
    jenjang: z.union([z.string(), z.undefined()]).transform((v) => (v && JENJANG_OPTIONS.includes(v) ? v : null)),
    address: optionalText(300),
    lat: optionalCoordinate,
    lng: optionalCoordinate,
    contactName: optionalText(120),
    contactPhone: phone,
    active: checkbox,
  })
  .superRefine((v, ctx) => {
    if ((v.lat === null) !== (v.lng === null)) {
      ctx.addIssue({ code: 'custom', path: ['lat'], message: 'Isi lintang dan bujur sekaligus, atau kosongkan keduanya.' });
      return;
    }
    if (v.lat !== null && v.lng !== null) {
      const b = INDRAMAYU_BOUNDS;
      if (v.lat < b.minLat || v.lat > b.maxLat || v.lng < b.minLng || v.lng > b.maxLng) {
        ctx.addIssue({ code: 'custom', path: ['lat'], message: 'Titik berada di luar Kabupaten Indramayu. Periksa kembali di peta.' });
      }
    }
  });

async function numberTaken(number: string | null, excludeId?: string) {
  if (!number) return false;
  const db = await getDb();
  const [row] = await db.select({ id: schema.gudep.id }).from(schema.gudep).where(eq(schema.gudep.number, number)).limit(1);
  return !!row && row.id !== excludeId;
}

export async function createGudepAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission('gudep.create');
  const parsed = parseForm(GudepSchema, formData);
  if (parsed.error) return parsed.error;
  const input = parsed.data;
  if (!canAccessKwarran(user, input.kwarranId)) return fail('Kwarran di luar wilayah Anda.', { kwarranId: 'Pilih kwarran Anda.' });
  if (await numberTaken(input.number)) return fail('Nomor gudep sudah terdaftar.', { number: 'Nomor ini sudah dipakai gudep lain.' });

  const db = await getDb();
  const [created] = await db
    .insert(schema.gudep)
    .values({ ...input, active: true })
    .returning({ id: schema.gudep.id });
  await audit(user, { action: 'gudep.create', summary: `Menambah gudep ${input.name}`, entityType: 'gudep', entityId: created.id });
  revalidatePath('/dashboard/gudep');
  redirect(`/dashboard/gudep/${created.id}?tersimpan=baru`);
}

export async function updateGudepAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission('gudep.update');
  const current = await getGudep(user, id);
  if (!current || !(await canAccessGudep(user, id))) return fail('Gudep tidak ditemukan atau di luar wilayah Anda.');

  const parsed = parseForm(GudepSchema, formData);
  if (parsed.error) return parsed.error;
  const input = parsed.data;

  // Staf gudep tidak boleh memindahkan gudep ke kwarran lain atau menonaktifkannya.
  const canRestructure = can(user, 'gudep.create');
  const kwarranId = canRestructure ? input.kwarranId : current.g.kwarranId;
  const active = canRestructure ? input.active : current.g.active;
  if (canRestructure && !canAccessKwarran(user, kwarranId))
    return fail('Kwarran di luar wilayah Anda.', { kwarranId: 'Pilih kwarran Anda.' });
  if (await numberTaken(input.number, id)) return fail('Nomor gudep sudah terdaftar.', { number: 'Nomor ini sudah dipakai gudep lain.' });

  const db = await getDb();
  await db
    .update(schema.gudep)
    .set({ ...input, kwarranId, active })
    .where(eq(schema.gudep.id, id));
  const moved = input.lat !== current.g.lat || input.lng !== current.g.lng;
  await audit(user, {
    action: 'gudep.update',
    summary: `Mengubah data gudep ${input.name}${moved ? ' (termasuk lokasi peta)' : ''}`,
    entityType: 'gudep',
    entityId: id,
  });
  revalidatePath('/dashboard/gudep');
  redirect(`/dashboard/gudep/${id}?tersimpan=ubah`);
}
