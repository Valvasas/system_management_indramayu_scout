'use server';

/**
 * Server Action tipis untuk SKU/SKK (2.3): izin (requirePermission) → jalur formulir di
 * competency.ts (Zod + izin + cakupan + log audit, teruji di Vitest) → pesan → revalidasi.
 * Isi catatan pembina tidak pernah ditulis ke log audit maupun notifikasi.
 */
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requirePermission } from '@/lib/auth/session';
import { fail, ok, type FormState } from '@/lib/forms';
import { clientIp } from '@/lib/security/request';
import { saveRequirementForm, setRequirementActive, verificationForm, type VerifyFailure } from './competency';

/* ---------------- Data referensi ---------------- */

const CHECK = 'Periksa kembali isian yang ditandai.';

export async function saveRequirementAction(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission('competency.manage');
  const result = await saveRequirementForm(user, id, formData, { ip: clientIp() });
  if (!result.ok) {
    if (result.reason === 'tidak-valid') return fail(CHECK, result.errors);
    if (result.reason === 'kode-dipakai') return fail(CHECK, { code: 'Kode ini sudah dipakai syarat lain.' });
    if (result.reason === 'golongan-terkunci')
      return fail(CHECK, {
        golongan: 'Golongan tidak dapat diubah karena syarat ini sudah pernah diverifikasi. Nonaktifkan, lalu buat syarat baru.',
      });
    return fail('Syarat tidak ditemukan. Muat ulang halaman.');
  }
  revalidatePath('/dashboard/sku');
  redirect(`/dashboard/sku?tersimpan=${result.created ? 'baru' : 'ubah'}`);
}

export async function setRequirementActiveAction(id: string, active: boolean): Promise<void> {
  const user = await requirePermission('competency.manage');
  const row = await setRequirementActive(user, id, active, { ip: clientIp() });
  revalidatePath('/dashboard/sku');
  redirect(row ? `/dashboard/sku/${row.id}?tersimpan=${active ? 'aktif' : 'nonaktif'}` : '/dashboard/sku');
}

/* ---------------- Verifikasi anggota ---------------- */

const FAILURES: Record<VerifyFailure, string> = {
  'tidak-ditemukan': 'Data anggota tidak ditemukan atau di luar wilayah Anda.',
  nonaktif: 'Anggota yang diarsipkan tidak dapat diubah kemajuan SKU/SKK-nya.',
  'tidak-berlaku': 'Syarat ini tidak aktif atau bukan untuk golongan anggota ini. Muat ulang halaman.',
  sudah: 'Syarat ini sudah terverifikasi sebelumnya. Muat ulang halaman.',
  belum: 'Syarat ini belum terverifikasi, jadi tidak ada yang dibatalkan. Muat ulang halaman.',
  'tidak-valid': CHECK,
};

/** Satu formulir per syarat: tombol "Tandai terverifikasi" / "Batalkan verifikasi" mengirim `intent`. */
export async function verificationAction(memberId: string, requirementId: string, _prev: FormState, formData: FormData) {
  const user = await requirePermission('competency.verify');
  const result = await verificationForm(user, memberId, requirementId, formData, { ip: clientIp() });
  if (!result.ok) return fail(FAILURES[result.reason], result.errors);
  revalidatePath(`/dashboard/anggota/${memberId}`);
  return ok(result.intent === 'verify' ? `Syarat ${result.code} tercatat terverifikasi.` : `Verifikasi syarat ${result.code} dibatalkan.`);
}
