'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { addAssignment, endAssignment } from '@/features/terms/assignments';
import { audit } from '@/lib/auth/audit';
import { requirePermission } from '@/lib/auth/session';
import { ok, type FormState } from '@/lib/forms';

/**
 * Penugasan staf (2.4). Logika, validasi, dan cakupan di features/terms/assignments.ts; di sini
 * izin sesi + audit. Penugasan bersifat informasional: tidak mengubah wilayah atau akses akun.
 */
export async function addAssignmentAction(userId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requirePermission('users.manage');
  const result = await addAssignment(actor, userId, formData);
  if (!result.ok) return result.state;
  await audit(actor, {
    action: 'user.assignment_added',
    summary: `Mencatat penugasan "${result.position}"`,
    entityType: 'user',
    entityId: userId,
  });
  revalidatePath(`/dashboard/pengguna/${userId}`);
  return ok('Penugasan tercatat. Wilayah dan akses akun tidak berubah.');
}

export async function endAssignmentAction(userId: string, assignmentId: string): Promise<void> {
  const actor = await requirePermission('users.manage');
  const result = await endAssignment(actor, userId, assignmentId);
  if (result.ok) {
    await audit(actor, {
      action: 'user.assignment_ended',
      summary: `Mengakhiri penugasan "${result.position}" per ${result.termEnd}`,
      entityType: 'user',
      entityId: userId,
    });
  }
  revalidatePath(`/dashboard/pengguna/${userId}`);
  redirect(`/dashboard/pengguna/${userId}?penugasan=${result.ok ? 'diakhiri' : 'gagal'}`);
}
