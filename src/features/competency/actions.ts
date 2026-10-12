'use server';

/**
 * Server Action tipis untuk SKU/SKK (2.3): izin (requirePermission) → Zod → inti di
 * competency.ts (yang menegakkan izin + cakupan lagi) → audit → revalidasi.
 * Isi catatan pembina tidak pernah ditulis ke log audit.
 */
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { audit } from '@/lib/auth/audit';
import { requirePermission } from '@/lib/auth/session';
import { fail, ok, parseForm, type FormState } from '@/lib/forms';
import { revokeVerification, saveRequirement, setRequirementActive, verifyRequirement, type VerifyFailure } from './competency';
import { NoteSchema, RequirementSchema } from './validation';

/* ---------------- Data referensi ---------------- */

export async function saveRequirementAction(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission('competency.manage');
  const parsed = parseForm(RequirementSchema, formData);
  if (parsed.error) return parsed.error;
  const result = await saveRequirement(user, id, parsed.data);
  if (!result.ok) {
    if (result.reason === 'kode-dipakai') return fail('Periksa kembali isian yang ditandai.', { code: 'Kode ini sudah dipakai syarat lain.' });
    if (result.reason === 'golongan-terkunci')
      return fail('Periksa kembali isian yang ditandai.', {
        golongan: 'Golongan tidak dapat diubah karena syarat ini sudah pernah diverifikasi. Nonaktifkan, lalu buat syarat baru.',
      });
    return fail('Syarat tidak ditemukan.');
  }
  await audit(user, {
    action: id ? 'competency.requirement_updated' : 'competency.requirement_created',
    summary: `${id ? 'Mengubah' : 'Menambah'} syarat ${parsed.data.kind} ${parsed.data.code}`,
    entityType: 'competency_requirement',
    entityId: result.id,
  });
  revalidatePath('/dashboard/sku');
  redirect('/dashboard/sku?tersimpan=1');
}

export async function setRequirementActiveAction(id: string, active: boolean): Promise<void> {
  const user = await requirePermission('competency.manage');
  const row = await setRequirementActive(user, id, active);
  if (row) {
    await audit(user, {
      action: active ? 'competency.requirement_activated' : 'competency.requirement_deactivated',
      summary: `${active ? 'Mengaktifkan' : 'Menonaktifkan'} syarat ${row.code}`,
      entityType: 'competency_requirement',
      entityId: id,
    });
  }
  revalidatePath('/dashboard/sku');
  redirect(row ? `/dashboard/sku/${id}?tersimpan=${active ? 'aktif' : 'nonaktif'}` : '/dashboard/sku');
}

/* ---------------- Verifikasi anggota ---------------- */

const FAILURES: Record<VerifyFailure, string> = {
  'tidak-ditemukan': 'Data anggota tidak ditemukan atau di luar wilayah Anda.',
  nonaktif: 'Anggota yang diarsipkan tidak dapat diubah kemajuan SKU/SKK-nya.',
  'tidak-berlaku': 'Syarat ini tidak aktif atau bukan untuk golongan anggota ini. Muat ulang halaman.',
  sudah: 'Syarat ini sudah terverifikasi sebelumnya. Muat ulang halaman.',
  belum: 'Syarat ini belum terverifikasi, jadi tidak ada yang dibatalkan. Muat ulang halaman.',
};

export async function verifyRequirementAction(memberId: string, requirementId: string, _prev: FormState, formData: FormData) {
  const user = await requirePermission('competency.verify');
  const parsed = parseForm(NoteSchema, formData);
  if (parsed.error) return parsed.error;
  const result = await verifyRequirement(user, memberId, requirementId, parsed.data.note);
  if (!result.ok) return fail(FAILURES[result.reason]);
  await audit(user, {
    action: 'competency.verified',
    summary: `Memverifikasi syarat ${result.code} untuk ${result.memberName}`,
    entityType: 'member',
    entityId: memberId,
  });
  revalidatePath(`/dashboard/anggota/${memberId}`);
  return ok(`Syarat ${result.code} tercatat terverifikasi.`);
}

export async function revokeVerificationAction(memberId: string, requirementId: string, _prev: FormState, formData: FormData) {
  const user = await requirePermission('competency.verify');
  const parsed = parseForm(NoteSchema, formData);
  if (parsed.error) return parsed.error;
  const result = await revokeVerification(user, memberId, requirementId, parsed.data.note);
  if (!result.ok) return fail(FAILURES[result.reason]);
  await audit(user, {
    action: 'competency.revoked',
    summary: `Membatalkan verifikasi syarat ${result.code} untuk ${result.memberName}`,
    entityType: 'member',
    entityId: memberId,
  });
  revalidatePath(`/dashboard/anggota/${memberId}`);
  return ok(`Verifikasi syarat ${result.code} dibatalkan.`);
}
